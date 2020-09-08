import React, { FunctionComponent } from 'react';
import HomeNav from './HomeNav';

interface PageProps {
  headerClass: string;
}

const Page: FunctionComponent<PageProps> = ({ children, headerClass }) => (
  <div className="d-flex w-100 h-100 p-3 mx-auto flex-column" style={{ maxWidth: '60rem' }}>
    <HomeNav headerClass={headerClass} />
    <main>{children}</main>
    <footer className="mt-auto"></footer>
  </div>
);
export default Page;
