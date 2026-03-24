import React, { useContext, useState } from 'react';
import { useDialogs } from "dialogs";
import cockpit from 'cockpit';
import * as timeformat from 'timeformat';

// import { ListingPanel } from 'cockpit-components-listing-panel';
import { ListingTable, ListingTableProps } from "cockpit-components-table";
import { BootcStatusContext } from './BootcContext';
import { BootedObject } from './BootcAPI';
import { Flex, getUniqueId, Label } from '@patternfly/react-core';
import { CheckCircleIcon, KeyIcon, PendingIcon } from '@patternfly/react-icons';

const _ = cockpit.gettext;

interface DeploymentDetailsProps {
  bootObject: BootedObject;
  staged?: boolean;
  current?: boolean;
}

const DeploymentDetails = ({bootObject, staged, current}: DeploymentDetailsProps) => {
    const version = bootObject.image?.version;
    const image = bootObject.image?.image?.image;

    const labels = [];
    // Is it signed?
    if (bootObject?.image?.image.signature)
        labels.push(<Label color="purple" icon={<KeyIcon />} key={"signed" + version}>{_("Signed")}</Label>);
    // Is it staged?
    if (staged)
        labels.push(<Label icon={<PendingIcon />} key={"staged" + version}>{_("Staged")}</Label>);
    if (current)
        labels.push(<Label color="blue" key={"current" + version} icon={<CheckCircleIcon />}>{_("Current")}</Label>);
    // if (info?.pinned?.v)
    //     labels.push(<Label color="grey" key={"pinned" + version}>{_("Pinned")}</Label>);
    // if (error)
    //     labels.push(
    //         <Popover headerContent={error.title}
    //             bodyContent={error.details}
    //             className="ct-popover-alert"
    //             key={"error" + version}
    //         >
    //             <Label color="red"
    //             icon={<ErrorCircleOIcon />}
    //             className="deployment-error"
    //             closeBtnAriaLabel={_("Close")}
    //             onClose={() => setError(akey, null)}>
    //                 <>
    //                     {_("Failed")}
    //                     <Button variant="link" isInline>{_("view more...")}</Button>
    //                 </>
    //             </Label>
    //         </Popover>
    //     );
    // if (isUpdate(info) || isRebase(info))
    //     labels.push(<Label color="green" key={"new" + version}>{_("New")}</Label>);

    // let action_name = null;
    // let action = null;
    // const releaseTime = timeformat.distanceToNow(info.timestamp.v * 1000, true);

    // if (isUpdate(info)) {
    //     action_name = "update";
    //     action = () => Dialogs.show(<ConfirmDeploymentChange actionName={action_name}
    //         bodyText={cockpit.format(_("System will rebase to $0, updated $1."), version, releaseTime)}
    //         onConfirmAction={() => doUpgrade(akey, info.osname.v, info.checksum.v)}
    //     />);
    // } else if (isRollback(info)) {
    //     action_name = "rollback";
    //     action = () => Dialogs.show(<ConfirmDeploymentChange actionName={action_name}
    //         bodyText={cockpit.format(_("System will rebase to $0, updated $1."), version, releaseTime)}
    //         onConfirmAction={() => doRollback(akey, info.osname.v)}
    //     />);
    // } else if (isRebase(info)) {
    //     action_name = "rebase";
    //     action = () => Dialogs.show(<ConfirmDeploymentChange actionName={action_name}
    //         bodyText={cockpit.format(_("System will rebase to $0, updated $1."), version, releaseTime)}
    //         onConfirmAction={() => doRebase(akey, info.osname.v, info.origin.v, info.checksum.v)}
    //     />);
    // }

    // const action_button_text = {
    //     update: _("Update"),
    //     rollback: _("Roll back"),
    //     rebase: _("Rebase"),
    // };
    const columns = [];
    console.log("image", image, bootObject);
    if (image) {
      columns.push({
          title: version ?? "",
          props: {
            className: "deployment-name"
          }
        });
      columns.push({
          title: (
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {labels}
            </Flex>
          ),
      });
      columns.push({
        title: bootObject.image?.timestamp ? timeformat.distanceToNow(bootObject.image?.timestamp) : ""
      });
      columns.push({
        title: image
      })
    };

    // columns.push({ title: releaseTime });

    // columns.push({ title: info.origin?.v });

    // if (action_name) {
    //     columns.push({
    //         title: (
    //             <Flex justifyContent={{ default: "justifyContentFlexEnd" }}>
    //                 <Button size="sm" onClick={action}
    //                     variant={action_name === "rollback" ? "secondary" : "primary"}
    //                 >
    //                     {action_button_text[action_name]}
    //                 </Button>
    //             </Flex>
    //         ),
    //     });
    // } else {
    //     columns.push({ title: "" });
    // }

    // if (info.index !== undefined) {
    //     columns.push({
    //         title: (
    //             <DeploymentActions deploymentIndex={info.index}
    //                 deploymentIsPinned={info?.pinned?.v}
    //                 isCurrent={info.booted.v}
    //                 isStaged={info.staged.v}
    //             />
    //         ),
    //         props: { className: "pf-v6-c-table__action" }
    //     });
    // }

    // let signatures = [];
    // if (info.signatures && info.signatures.v.length > 0)
    //     signatures = info.signatures.v.map((raw) => client.signature_obj(raw));

    // const tabRenderers = [
    //     {
    //         name: _("Tree"),
    //         renderer: TreeDetails,
    //         data: { info },
    //     },
    //     {
    //         name: _("Packages"),
    //         renderer: Packages,
    //         data: { packages },
    //     },
    //     {
    //         name: _("Signatures"),
    //         renderer: SignaturesDetails,
    //         data: { signatures },
    //     },
    // ];

    return ({
        props: { key: getUniqueId("deployment") },
        columns,
        // expandedContent: <ListingPanel tabRenderers={tabRenderers} />
    });
};

export const Deployments = () => {
  const bootcStatus = useContext(BootcStatusContext);
  // const Dialogs = useDialogs();
  const [inProgress, setInProgress] = useState({});
  const [error, _setError] = useState({});

  // const setError = (id, err) => {
  //   _setError({ ...error, [id]: err });
  // };

  // const doRollback = (key, osname) => {
  //   const args = {
  //     reboot: cockpit.variant("b", true)
  //   };
  //   setInProgress({ ...inProgress, [key]: true });
  //   return client.run_transaction("Rollback", [args], osname)
  //   .catch(ex => setError(key, { title: _("Failed to roll back deployment"), details: ex }))
  //   .finally(() => setInProgress({ ...inProgress, [key]: false }));
  // };

  // const doUpgrade = (key, osname, checksum) => {
  //   const args = {
  //     reboot: cockpit.variant("b", true)
  //   };
  //   setInProgress({ ...inProgress, [key]: true });
  //   return client.run_transaction("Deploy", [checksum, args], osname)
  //   .catch(ex => setError(key, { title: _("Failed to upgrade deployment"), details: ex }))
  //   .finally(() => setInProgress({ ...inProgress, [key]: false }));
  // };

  // const doRebase = (key, osname, origin, checksum) => {
  //   const args = {
  //     reboot: cockpit.variant("b", true),
  //     revision: cockpit.variant("s", checksum),
  //   };
  //   setInProgress({ ...inProgress, [key]: true });
  //   return client.run_transaction("Rebase", [args, origin, []], osname)
  //   .catch(ex => setError(key, { title: _("Failed to rebase deployment"), details: ex }))
  //   .finally(() => setInProgress({ ...inProgress, [key]: false }));
  // };

  const columns: ListingTableProps["columns"] = [
    {
      title: _("Version"),
      props: { width: 15, },
    },
    {
      title: _("Status"),
      props: { width: 15, },
    },
    {
      title: _("Time"),
      props: { width: 15, },
    },
    {
      title: _("Branch"),
    },
    {
      title: "",
      props: { className: "pf-v6-c-table__action" }
    },
  ];


  const rows: ListingTableProps["rows"] = [];
  if (bootcStatus?.status?.staged) {
    rows.push(DeploymentDetails({ bootObject: bootcStatus.status.staged, staged: true }))
  }
  if (bootcStatus?.status?.booted) {
    rows.push(DeploymentDetails({ bootObject: bootcStatus.status.booted, current: true }))
  }
  if (bootcStatus?.status?.rollback) {
    rows.push(DeploymentDetails({ bootObject: bootcStatus.status.rollback }))
  }

  return (
    <ListingTable
      aria-label={_("Deployments and updates")}
      id="available-deployments"
      columns={columns}
      variant="compact"
      gridBreakPoint="grid-lg"
      rows={rows}
    />
  );
};
