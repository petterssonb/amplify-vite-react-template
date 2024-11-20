import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import { graphqlTest } from './functions/graphqltest/resource';

const backend = defineBackend({
  auth,
  data,
  graphqlTest,
});