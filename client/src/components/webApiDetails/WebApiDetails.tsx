import React from 'react';
import { WebApi } from '../../../../server/src/models/WebApi';
import { getNameOfAction } from '../../util/webApi';
import CheckBox from '../Checkbox';

interface Props {
  actions: WebApi['actions'];
  setActionAs: (id: string, val: boolean) => void;
  annotationCompFn: () => JSX.Element;
}

const WebApiDetails = ({ annotationCompFn, actions, setActionAs }: Props) => (
  <div>
    {annotationCompFn()}
    <h4 className="mb-4 mt-5">Actions Overview</h4>
    <p>Non active actions will not be added to the WebAPI annotation</p>
    <table className="table table-striped">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">ID</th>
          <th scope="col">Is active</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((action) => (
          <tr key={action.id}>
            <td>{getNameOfAction(action)}</td>
            <td>{action.id}</td>
            <td>
              <span title="Set Action as active/inactive">
                <CheckBox checked={action.isActive} setChecked={(val) => setActionAs(action.id, val)} />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default WebApiDetails;
