import { Action, WebApi } from '../../../server/src/models/WebApi';
import { useState } from 'react';
import ky from 'ky';
import { usePrefixWith } from './VocabHandler';
import { filterUndef, Optional } from './utils';

export interface EnrichedAction {
  action: Action;
  webApi: Pick<WebApi, 'id' | 'name' | 'templates'>;
  usePrefix: (s: string) => string;
}

export type ActionStore = ReturnType<typeof useActionStore>;

export const useActionStore = () => {
  const [actions, setActions] = useState<EnrichedAction[]>([]);

  const getActions = (actionIds: string[]): Optional<EnrichedAction[]> => {
    const missingActions = actionIds.filter((id) => !actions.map((act) => act.action.id).includes(id));
    if (missingActions.length > 0) {
      ky.get('/api/webApi/actions/' + missingActions.join(','))
        .json()
        .then((resp: any) => {
          const newActions: EnrichedAction[] = resp.flatMap((webApi: any) =>
            webApi.actions.map((action: any) => ({
              action,
              webApi: {
                id: webApi.id,
                name: webApi.name,
                templates: webApi.templates,
              },
              // eslint-disable-next-line react-hooks/rules-of-hooks
              usePrefix: usePrefixWith(webApi.prefixes),
            })),
          );
          if (newActions.length > 0) {
            setActions([...actions, ...newActions]);
          }
        });

      return undefined;
    }

    const foundActions = filterUndef(actionIds.map((id) => actions.find((act) => act.action.id === id)));
    return foundActions;
  };

  return { getActions };
};
