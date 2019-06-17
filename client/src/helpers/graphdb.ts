import axios from 'axios';

const defaultGraphDB = {
  repositoryId: 'sdo-webapi',
  url: 'https://graphdb.sti2.at/', // http://localhost:7200'
};

export const saveToGraphDb = async (annotations: any): Promise<boolean> => {
  try {
    await axios({
      method: 'post',
      url: `${defaultGraphDB.url}/repositories/${defaultGraphDB.repositoryId}/statements`,
      headers: {
        Accept: 'application/ld+json',
        'Content-Type': 'application/ld+json',
      },
      data: annotations,
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
