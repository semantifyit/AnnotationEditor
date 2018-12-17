import { ISemantifyUser, ISemantifyWebsite } from './semantify';

const parseOrUndef = (o: string | null) => {
  if (o) {
    try {
      return JSON.parse(o);
    } catch (e) {
      return;
    }
  }
  return;
};

export const getSemantifyUser = (): ISemantifyUser | undefined => {
  const user = localStorage.getItem('semantify-user');
  return parseOrUndef(user);
};

export const setSemantifyUser = (user: ISemantifyUser) =>
  localStorage.setItem('semantify-user', JSON.stringify(user));

export const removeSemantifyUser = () =>
  localStorage.removeItem('semantify-user');

export const setSemantifyDefaultWebsite = (website: ISemantifyWebsite) =>
  localStorage.setItem('semantify-website', JSON.stringify(website));

export const getSemantifyDefaultWebsite = (): ISemantifyWebsite | undefined => {
  const website = localStorage.getItem('semantify-website');
  return parseOrUndef(website);
};

export const removeSemantifyDefaultWebsite = () =>
  localStorage.removeItem('semantify-website');
