import React from 'react';
import { VerificationReport } from '../../../../server/src/util/verification/verification';
import uuid from 'uuid';

const VerificationReportBox = ({ report }: { report: VerificationReport }) =>
  report.length > 0 ? (
    <div className="alert alert-danger" role="alert">
      <h6>The Action verification has found some problems:</h6>
      <ul className="list-group">
        {report.map((r, i) => (
          <li key={uuid()} className="list-group-item">
            <b>{r.name}</b>
            <p>
              {r.description}
              <br />
              {r.path}
            </p>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div className="alert alert-success" role="alert">
      Action verification successful!
    </div>
  );

export default VerificationReportBox;
