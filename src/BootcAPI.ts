// To parse this data:
//
//   import { Convert, BootcAPI } from "./file";
//
//   const bootcAPI = Convert.toBootcAPI(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * The core host definition
 */
export interface BootcAPI {
    apiVersion: string;
    kind:       string;
    metadata?:  Metadata;
    /**
     * The spec
     */
    spec?: Spec;
    /**
     * The status
     */
    status?: Status;
    [property: string]: any;
}

export interface Metadata {
    annotations?: { [key: string]: string } | null;
    labels?:      { [key: string]: string } | null;
    name?:        null | string;
    namespace?:   null | string;
    [property: string]: any;
}

/**
 * The spec
 *
 * The host specification
 */
export interface Spec {
    /**
     * If set, and there is a rollback deployment, it will be set for the next boot.
     */
    bootOrder?: BootOrderEnum;
    /**
     * The host image
     */
    image?: null | BootcAPISchema;
    [property: string]: any;
}

/**
 * If set, and there is a rollback deployment, it will be set for the next boot.
 *
 * Configuration for system boot ordering.
 *
 * The staged or booted deployment will be booted next
 *
 * The rollback deployment will be booted next
 */
export enum BootOrderEnum {
    Default = "default",
    Rollback = "rollback",
}

/**
 * A container image reference with attached transport and signature verification
 *
 * The currently booted image
 */
export interface BootcAPISchema {
    /**
     * The container image reference
     */
    image: string;
    /**
     * Signature verification type
     */
    signature?: SignatureClass | SignatureEnum | null;
    /**
     * The container image transport
     */
    transport: string;
    [property: string]: any;
}

/**
 * Fetches will use the named ostree remote for signature verification of the ostree commit.
 */
export interface SignatureClass {
    ostreeRemote: string;
}

/**
 * Fetches will defer to the `containers-policy.json`, but we make a best effort to reject
 * `default: insecureAcceptAnything` policy.
 *
 * No signature verification will be performed
 */
export enum SignatureEnum {
    ContainerPolicy = "containerPolicy",
    Insecure = "insecure",
}

/**
 * The status
 *
 * The status of the host system
 */
export interface Status {
    /**
     * The booted image; this will be unset if the host is not bootc compatible.
     */
    booted?: null | BootedObject;
    /**
     * Other deployments (i.e. pinned)
     */
    otherDeployments?: BootedObject[];
    /**
     * The previously booted image
     */
    rollback?: null | BootedObject;
    /**
     * Set to true if the rollback entry is queued for the next boot.
     */
    rollbackQueued?: boolean;
    /**
     * The staged image for the next boot
     */
    staged?: null | BootedObject;
    /**
     * The detected type of system
     */
    type?: TypeEnum | null;
    [property: string]: any;
}

/**
 * A bootable entry
 */
export interface BootedObject {
    /**
     * The last fetched cached update metadata
     */
    cachedUpdate?: null | CachedUpdateObject;
    /**
     * If this boot entry is composefs based, the corresponding state
     */
    composefs?: null | ComposefsObject;
    /**
     * The image reference
     */
    image?: null | CachedUpdateObject;
    /**
     * Whether this boot entry is not compatible (has origin changes bootc does not understand)
     */
    incompatible: boolean;
    /**
     * If this boot entry is ostree based, the corresponding state
     */
    ostree?: null | OstreeObject;
    /**
     * Whether this entry will be subject to garbage collection
     */
    pinned: boolean;
    /**
     * This is true if (relative to the booted system) this is a possible target for a soft
     * reboot
     */
    softRebootCapable?: boolean;
    /**
     * The container storage backend
     */
    store?: StoreEnum | null;
    [property: string]: any;
}

/**
 * The status of the booted image
 */
export interface CachedUpdateObject {
    /**
     * The hardware architecture of this image
     */
    architecture: string;
    /**
     * The currently booted image
     */
    image: BootcAPISchema;
    /**
     * The digest of the fetched image (e.g. sha256:a0...);
     */
    imageDigest: string;
    /**
     * The build timestamp, if any
     */
    timestamp?: Date | null;
    /**
     * The version string, if any
     */
    version?: null | string;
    [property: string]: any;
}

/**
 * A bootable entry
 */
export interface ComposefsObject {
    /**
     * Whether we boot using systemd or grub
     */
    bootloader: BootloaderEnum;
    /**
     * Whether this deployment is to be booted via Type1 (vmlinuz + initrd) or Type2 (UKI) entry
     */
    bootType: BootTypeEnum;
    /**
     * The erofs verity
     */
    verity: string;
    [property: string]: any;
}

/**
 * Whether this deployment is to be booted via Type1 (vmlinuz + initrd) or Type2 (UKI) entry
 */
export enum BootTypeEnum {
    Bls = "Bls",
    Uki = "Uki",
}

/**
 * Whether we boot using systemd or grub
 *
 * Bootloader type to determine whether system was booted via Grub or Systemd
 *
 * Use Grub as the booloader
 *
 * Use SystemdBoot as the bootloader
 */
export enum BootloaderEnum {
    Grub = "Grub",
    Systemd = "Systemd",
}

/**
 * A bootable entry
 */
export interface OstreeObject {
    /**
     * The ostree commit checksum
     */
    checksum: string;
    /**
     * The deployment serial
     */
    deploySerial: number;
    /**
     * The name of the storage for /etc and /var content
     */
    stateroot: string;
    [property: string]: any;
}

/**
 * The container storage backend
 *
 * Use the ostree-container storage backend.
 */
export enum StoreEnum {
    OstreeContainer = "ostreeContainer",
}

/**
 * The detected type of running system.  Note that this is not exhaustive
 * and new variants may be added in the future.
 *
 * The current system is deployed in a bootc compatible way.
 */
export enum TypeEnum {
    BootcHost = "bootcHost",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toBootcAPI(json: string): BootcAPI {
        return cast(JSON.parse(json), r("BootcAPI"));
    }

    public static bootcAPIToJson(value: BootcAPI): string {
        return JSON.stringify(uncast(value, r("BootcAPI")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "BootcAPI": o([
        { json: "apiVersion", js: "apiVersion", typ: "" },
        { json: "kind", js: "kind", typ: "" },
        { json: "metadata", js: "metadata", typ: u(undefined, r("Metadata")) },
        { json: "spec", js: "spec", typ: u(undefined, r("Spec")) },
        { json: "status", js: "status", typ: u(undefined, r("Status")) },
    ], "any"),
    "Metadata": o([
        { json: "annotations", js: "annotations", typ: u(undefined, u(m(""), null)) },
        { json: "labels", js: "labels", typ: u(undefined, u(m(""), null)) },
        { json: "name", js: "name", typ: u(undefined, u(null, "")) },
        { json: "namespace", js: "namespace", typ: u(undefined, u(null, "")) },
    ], "any"),
    "Spec": o([
        { json: "bootOrder", js: "bootOrder", typ: u(undefined, r("BootOrderEnum")) },
        { json: "image", js: "image", typ: u(undefined, u(null, r("BootcAPISchema"))) },
    ], "any"),
    "BootcAPISchema": o([
        { json: "image", js: "image", typ: "" },
        { json: "signature", js: "signature", typ: u(undefined, u(r("SignatureClass"), r("SignatureEnum"), null)) },
        { json: "transport", js: "transport", typ: "" },
    ], "any"),
    "SignatureClass": o([
        { json: "ostreeRemote", js: "ostreeRemote", typ: "" },
    ], false),
    "Status": o([
        { json: "booted", js: "booted", typ: u(undefined, u(null, r("BootedObject"))) },
        { json: "otherDeployments", js: "otherDeployments", typ: u(undefined, a(r("BootedObject"))) },
        { json: "rollback", js: "rollback", typ: u(undefined, u(null, r("BootedObject"))) },
        { json: "rollbackQueued", js: "rollbackQueued", typ: u(undefined, true) },
        { json: "staged", js: "staged", typ: u(undefined, u(null, r("BootedObject"))) },
        { json: "type", js: "type", typ: u(undefined, u(r("TypeEnum"), null)) },
    ], "any"),
    "BootedObject": o([
        { json: "cachedUpdate", js: "cachedUpdate", typ: u(undefined, u(null, r("CachedUpdateObject"))) },
        { json: "composefs", js: "composefs", typ: u(undefined, u(null, r("ComposefsObject"))) },
        { json: "image", js: "image", typ: u(undefined, u(null, r("CachedUpdateObject"))) },
        { json: "incompatible", js: "incompatible", typ: true },
        { json: "ostree", js: "ostree", typ: u(undefined, u(null, r("OstreeObject"))) },
        { json: "pinned", js: "pinned", typ: true },
        { json: "softRebootCapable", js: "softRebootCapable", typ: u(undefined, true) },
        { json: "store", js: "store", typ: u(undefined, u(r("StoreEnum"), null)) },
    ], "any"),
    "CachedUpdateObject": o([
        { json: "architecture", js: "architecture", typ: "" },
        { json: "image", js: "image", typ: r("BootcAPISchema") },
        { json: "imageDigest", js: "imageDigest", typ: "" },
        { json: "timestamp", js: "timestamp", typ: u(undefined, u(Date, null)) },
        { json: "version", js: "version", typ: u(undefined, u(null, "")) },
    ], "any"),
    "ComposefsObject": o([
        { json: "bootloader", js: "bootloader", typ: r("BootloaderEnum") },
        { json: "bootType", js: "bootType", typ: r("BootTypeEnum") },
        { json: "verity", js: "verity", typ: "" },
    ], "any"),
    "OstreeObject": o([
        { json: "checksum", js: "checksum", typ: "" },
        { json: "deploySerial", js: "deploySerial", typ: 0 },
        { json: "stateroot", js: "stateroot", typ: "" },
    ], "any"),
    "BootOrderEnum": [
        "default",
        "rollback",
    ],
    "SignatureEnum": [
        "containerPolicy",
        "insecure",
    ],
    "BootTypeEnum": [
        "Bls",
        "Uki",
    ],
    "BootloaderEnum": [
        "Grub",
        "Systemd",
    ],
    "StoreEnum": [
        "ostreeContainer",
    ],
    "TypeEnum": [
        "bootcHost",
    ],
};
