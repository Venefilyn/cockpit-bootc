/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState } from 'react';
import { BootcAPI, Convert } from "./BootcAPI";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";

import cockpit from 'cockpit';
import { Alert, Page } from '@patternfly/react-core';

const _ = cockpit.gettext;


export async function getStatus() {
    const output = await cockpit.spawn(["bootc", "status", "--json", "--format-version=1"],
        { superuser: "require", err: "message" });
    // bootc status is the only one that has an API
    return Convert.toBootcAPI(output);
}

interface HasUpgradeType {
    hasUpgrades: true;
    repo: string;
    version: string;
    digest: string;
}
interface HasNoUpgradeType {
    hasUpgrades: false
}
type UpgradeType = HasUpgradeType | HasNoUpgradeType;

export async function checkUpgrades(): Promise<UpgradeType> {
    const output = await cockpit.spawn(["bootc", "upgrade", "--check"],
        { superuser: "require", err: "message" });
    if (output.includes("No changes in:")) {
        return {hasUpgrades: false}
    }
    const re = /Update available for: +(?<repo>\S+)\s*Version: +(?<version>\S+)\s*Digest: +(?<digest>\S+)/g
    const match = re.exec(output.trim())
    if (!match?.groups) {
        throw TypeError("Could not determine bootc upgrade.")
    }
    return {
        hasUpgrades: true,
        repo: match.groups["repo"],
        version: match.groups["version"],
        digest: match.groups["digest"]
    }
}


export const Application = () => {
    const [hostname, setHostname] = useState(_("Unknown"));
    const [status, setStatus] = useState<BootcAPI["status"]>(undefined)
    const [upgradeStatus, setUpgradeStatus] = useState<UpgradeType>()
    const [error, setError] = useState<string>()

    useEffect(() => {
        const hostname = cockpit.file('/etc/hostname');
        hostname.watch(content => setHostname(content?.trim() ?? ""));
        return hostname.close;
    }, []);

    useEffect(() => {
      getStatus().then(bootcApi=>{
        setStatus(bootcApi.status)
      })
      checkUpgrades().then(hasUpgrades => {
        setUpgradeStatus(hasUpgrades)
      }).catch(err => {
        setError(err.message);
        throw err;
      })
    }, [])



    return (
        <Page className='pf-m-no-sidebar'>
            {error && <Alert title="Error">{error}</Alert>}
            <Card>
                <CardTitle>Status</CardTitle>
                <CardBody>
                    <ul>
                        <li>
                            <pre>{upgradeStatus ? JSON.stringify(upgradeStatus, null, 2) : upgradeStatus}</pre>
                            <pre>{status ? JSON.stringify(status, null, 2) : ""}</pre>
                        </li>
                        <li>errors</li>
                    </ul>
                </CardBody>
            </Card>
            <Card>
                <CardTitle>Bootc Source</CardTitle>
                <CardBody>
                    <ul>
                        <li>Repo</li>
                        <li>branch</li>
                        <li>Signed/unsigned</li>
                    </ul>
                </CardBody>
            </Card>
            <Card>
                <CardTitle>Deployments and updates</CardTitle>
                <CardBody>
                    Table with version, status, time, branch, rollback button, actions with delete, pin or unpin.
                    Expand with tabs Tree, Packages, Signatures
                    Tree: OS, version, release, origin
                    Packages: List of all installed packages
                    Signatures: Idk
                </CardBody>
            </Card>
        </Page>

    );
};
