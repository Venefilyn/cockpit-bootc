import React, { useContext, useEffect, useState } from "react"
import { Card, CardTitle, CardBody, List, ListItem, Icon } from "@patternfly/react-core"
import { CheckIcon, InfoIcon, KeyIcon, QuestionIcon } from "@patternfly/react-icons";
import cockpit from 'cockpit';
import { BootcStatusContext } from "./BootcContext";

const _ = cockpit.gettext;

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

export const BootcStatus = ({ className="", onError }: { className?: string, onError: (status: string) => void }) => {
  const [status, setStatus] = useState<UpgradeType>()
  const bootcStatus = useContext(BootcStatusContext)

  useEffect(() => {
    // Not bootc
    if (bootcStatus?.spec?.image && bootcStatus.spec.image == null) {
      return;
    }

    checkUpgrades().then(hasUpgrades => {
      setStatus(hasUpgrades)
    }).catch(err => {
      onError(err.message);
    })
  }, [bootcStatus])

  const listItems: React.JSX.Element[] = []

  // Is system up-to-date
  if (bootcStatus?.spec?.image && bootcStatus.spec.image == null) {
    listItems.push(<ListItem key="not-bootc" icon={<Icon status="warning"><QuestionIcon /></Icon>}>{_("System is not configured for bootc")}</ListItem>)
  } else if (status?.hasUpgrades) {
    listItems.push(<ListItem key="version" icon={<Icon status="info"><InfoIcon /></Icon>}>{cockpit.format(_("System can be updated to $0"), status.version)}</ListItem>)
  } else if (!status) {
    listItems.push(<ListItem key="no-updates" icon={<Icon isInProgress />}>{_("Checking for updates")}</ListItem>)
  } else {
    listItems.push(<ListItem key="up-to-date" icon={<Icon status="success"><CheckIcon /></Icon>}>{_("System is up to date")}</ListItem>)
  }

  // TODO: Can we verify system will boot successfully? SecureBoot and all
  if (bootcStatus?.spec?.image?.signature || true) {
    listItems.push(<ListItem key="verified-boot" icon={<Icon status="info"><KeyIcon /></Icon>}>{_("Signed deployment")}</ListItem>)
  }

  // if (bootcStatus)

  return (
    <Card className={className}>
        <CardTitle>{_("Status")}</CardTitle>
        <CardBody>
          <List isPlain>
            {...listItems}
          </List>
        </CardBody>
    </Card>
  )
}
