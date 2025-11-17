import React, { useEffect, useState } from "react"
import { Card, CardTitle, CardBody, List, ListItem } from "@patternfly/react-core"
import { CheckIcon, InfoIcon } from "@patternfly/react-icons";
import cockpit from 'cockpit';

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

export const BootcStatus = ({ onError }: { onError: (status: string) => void }) => {
  const [status, setStatus] = useState<UpgradeType>()

  useEffect(() => {
    checkUpgrades().then(hasUpgrades => {
      setStatus(hasUpgrades)
    }).catch(err => {
      onError(err.message);
    })
  }, [])

  const listItems: React.JSX.Element[] = []

  if (status) {
    if (status.hasUpgrades) {
      listItems.push(<ListItem key="version" icon={<InfoIcon />}>System can be updated to {status.version}</ListItem>)
    } else {
      listItems.push(<ListItem key="no-updates" icon={<CheckIcon />}>{_("No updates available")}</ListItem>)
    }
  }

  return (
    <Card>
        <CardTitle>Status</CardTitle>
        <CardBody>
          <List>
            {...listItems}
          </List>
        </CardBody>
    </Card>
  )
}
