# API Actions

For details on this project see: https://semantifyit.github.io/actions-spec/#/

## Dev notes:

Running this with docker:

```
docker-compose build
docker-compose up
```

app will run on localhost:8009

The mongodb will be empty and not contain any vocabularies, please upload at least schema.org & schema.org pending (& webapi.ttl - sample/simple shacl shape file).

Adding vocabularies:

http://localhost:8009/webAPI/new -> Vocabularies -> Add vocabularies -> Set Name -> click choose file -> choose vocab file, e.g. from /server/vocabs/schema.jsonld -> Add vocab.

Then set them to "Is used" at the right hand side of the vocab table.

### Docker hints

Mongodb runs without any volumes, data will be gone if the container is deleted.
