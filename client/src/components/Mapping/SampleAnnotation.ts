export const sampleAnnotation1 = {
  '@context': { '@vocab': 'http://schema.org/' },
  '@type': 'SearchAction',
  actionStatus: {
    '@id': 'http://schema.org/PotentialActionStatus',
    '@type': 'ActionStatusType',
  },
  description: 'Searches for room-availability for this hotel',
  name: 'Search for rooms and its offers',
  object: {
    '@type': 'LodgingReservation',
    'checkinTime-input': 'required',
    'checkoutTime-input': 'required',
    'numAdults-input': {
      '@type': 'PropertyValueSpecification',
      valuePattern: '^[0-9]*$',
    },
    'numChildren-input': {
      '@type': 'PropertyValueSpecification',
      maxValue: '10',
    },
    reservationFor: {
      '@type': 'Person',
      'name-input': {
        '@type': 'PropertyValueSpecification',
        valueRequired: 'true',
      },
    },
  },
  result: {
    '@type': ['Offer', 'LodgingReservation'],
    'name-output': 'required',
    'description-output': 'required',
  },
  target: {
    '@type': 'EntryPoint',
    contentType: 'application/ld+json',
    encodingType: 'application/ld+json',
    httpMethod: 'POST',
    urlTemplate: 'https://actions.semantify.it/api/easybooking/search/3896',
  },
};

export const sampleAnnotation = {
  '@context': 'http://schema.org/',
  '@type': 'CreateAction',
  name: 'Create Issues in repository',
  actionStatus: 'http://schema.org/PotentialAction',
  agent: {
    '@type': 'Person',
    'identifier-input': 'required',
  },
  object: {
    '@type': 'SoftwareSourceCode',
    'name-input': 'required',
    author: {
      '@type': 'Person',
      'name-input': 'required',
    },
  },
  result: {
    '@type': 'PublicationIssue',
    'issueNumber-output': 'required',
    'identifier-output': 'required',
    'url-output': 'required',
    'name-input': 'required',
    'description-input': 'required',
    'dateCreated-output': 'required',
    'dateModified-output': 'required',
    author: {
      '@type': 'Person',
      'name-output': 'required',
      'identifier-output': 'required',
      'url-output': 'required',
      'image-output': '',
    },
    'genre-input': {
      '@type': 'PropertyValueSpecification',
      required: 'false',
      multipleValuesAllowed: 'true',
    },
  },
};
