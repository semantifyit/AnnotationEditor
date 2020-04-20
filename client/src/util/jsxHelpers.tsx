import React, { useRef, useState, useEffect } from 'react';

// eslint-disable-next-line import/prefer-default-export
export const autoLink = (text: string): React.ReactElement => {
  // eslint-disable-next-line no-useless-escape
  const delimiter = /((?:https?:\/\/)?(?:(?:[a-z0-9]?(?:[a-z0-9\-]{1,61}[a-z0-9])?\.[^\.|\s])+[a-z\.]*[a-z]+|(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3})(?::\d{1,5})*[a-z0-9.,_\/~#&=;%+?\-\\(\\)]*)/gi;

  return (
    <>
      {text.split(delimiter).map((word, i) => {
        const match = word.match(delimiter);
        if (match) {
          const url = match[0];
          return (
            <a
              key={i}
              href={url.startsWith('http') ? url : `http://${url}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {url}
            </a>
          );
        }
        return word;
      })}
    </>
  );
};

export const joinReduction = (seperator: any) => (prev: any, curr: any) => [prev, seperator, curr];

export function useHover(): [React.MutableRefObject<any>, boolean] {
  const [value, setValue] = useState(false);
  const ref = useRef<any>(null);
  // eslint-disable-next-line no-sequences
  const handleMouseOver = (e: any) => (e.stopPropagation(), setValue(true));
  // eslint-disable-next-line no-sequences
  const handleMouseOut = (e: any) => (e.stopPropagation(), setValue(false));
  useEffect(
    () => {
      const node = ref.current;
      if (node) {
        node.addEventListener('mouseover', handleMouseOver);
        node.addEventListener('mouseout', handleMouseOut);

        return () => {
          node.removeEventListener('mouseover', handleMouseOver);
          node.removeEventListener('mouseout', handleMouseOut);
        };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ref.current], // Recall only if ref changes
  );
  return [ref, value];
}
