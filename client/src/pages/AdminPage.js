import React from 'react';
import styled from 'styled-components';
import AdManager from '../components/AdManager';

const AdminPageContainer = styled.div`
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const AdminPage = () => {
  return (
    <AdminPageContainer>
      <h1>Admin Dashboard</h1>
      <p>This is the main dashboard for site administrators.</p>
      <AdManager />
    </AdminPageContainer>
  );
};

export default AdminPage;
