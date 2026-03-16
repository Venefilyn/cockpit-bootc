import React, { useContext, useEffect, useState } from "react"
import { Card, CardTitle, CardBody, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from "@patternfly/react-core"
import cockpit from 'cockpit';
import { BootcStatusContext } from "./BootcContext";
import { splitRepoBranch } from "./helpers";

const _ = cockpit.gettext;

export const BootcSource = ({ onError }: { onError: (status: string) => void }) => {
  const status = useContext(BootcStatusContext);
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");

  // spec.image will be null if not valid
  // status.booted.incompatible will be true if layered packages

  useEffect(() => {
    const image = status?.spec?.image?.image
    if (!image)
      return;

    const origin = splitRepoBranch(image);
    setRepo(origin.remote);
    if (origin.branch)
      setBranch(origin.branch);

  }, [status])


  return (
    <Card>
        <CardTitle>Status</CardTitle>
        <CardBody>
          <DescriptionList isHorizontal>
              <DescriptionListGroup id="current-repository">
                  <DescriptionListTerm>{_("Repository")}</DescriptionListTerm>
                  <DescriptionListDescription>{repo}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup id="current-branch">
                  <DescriptionListTerm>{_("Branch")}</DescriptionListTerm>
                  <DescriptionListDescription>{branch}</DescriptionListDescription>
              </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
    </Card>
  )
}
