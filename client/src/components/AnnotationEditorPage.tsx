import * as React from 'react';
import AnnotationBlank from './AnnotationBlank';
import Vocab from '../helpers/Vocab';
import AnnotationTemplate from './AnnotationTemplate';
import AnnotationWebApi from './AnnotationWebApi';

import { VocabContext } from '../helpers/VocabContext';

interface IProps {
  type: 'blank' | 'template' | 'webapi';
}

class AnnotationEditorPage extends React.Component<IProps> {
  public vocab = new Vocab();

  public renderPage() {
    switch (this.props.type) {
      case 'blank':
        return <AnnotationBlank />;
      case 'template':
        return <AnnotationTemplate />;
      case 'webapi':
        return <AnnotationWebApi />;
    }
  }

  public render() {
    return (
      <VocabContext.Provider value={{ vocab: new Vocab() }}>
        {this.renderPage()}
      </VocabContext.Provider>
    );
  }
}

export default AnnotationEditorPage;
