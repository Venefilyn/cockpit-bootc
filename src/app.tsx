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
import { BootcStatus } from './BootcStatus';

const _ = cockpit.gettext;

export async function getStatus() {
  const output = await cockpit.spawn(["bootc", "status", "--json", "--format-version=1"],
    { superuser: "require", err: "message" });
  // bootc status is the only one that has an API
  return Convert.toBootcAPI(output);
}

export const Application = () => {
  const [hostname, setHostname] = useState(_("Unknown"));
  const [status, setStatus] = useState<BootcAPI["status"]>(undefined)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const hostname = cockpit.file('/etc/hostname');
    hostname.watch(content => setHostname(content?.trim() ?? ""));
    return hostname.close;
  }, []);

  return (
    <Page className='pf-m-no-sidebar'>
      {/* Create a Context provider thing and set data to that, makes it easier to send between all components */}
      {error && <Alert title="Error">{error}</Alert>}
      <BootcStatus onError={setError} />
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
