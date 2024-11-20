import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import { graphqlIoTCore } from './functions/graphqlIoTCore/resource';

const backend = defineBackend({
  auth,
  data,
  graphqlIoTCore,
});