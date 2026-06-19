# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListCommunities*](#listcommunities)
  - [*GetUserPosts*](#getuserposts)
- [**Mutations**](#mutations)
  - [*CreatePost*](#createpost)
  - [*CreateMessage*](#createmessage)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListCommunities
You can execute the `ListCommunities` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listCommunities(options?: ExecuteQueryOptions): QueryPromise<ListCommunitiesData, undefined>;

interface ListCommunitiesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCommunitiesData, undefined>;
}
export const listCommunitiesRef: ListCommunitiesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCommunities(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCommunitiesData, undefined>;

interface ListCommunitiesRef {
  ...
  (dc: DataConnect): QueryRef<ListCommunitiesData, undefined>;
}
export const listCommunitiesRef: ListCommunitiesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCommunitiesRef:
```typescript
const name = listCommunitiesRef.operationName;
console.log(name);
```

### Variables
The `ListCommunities` query has no variables.
### Return Type
Recall that executing the `ListCommunities` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCommunitiesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCommunitiesData {
  communities: ({
    name: string;
    description: string;
    creator: {
      displayName: string;
    };
  })[];
}
```
### Using `ListCommunities`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCommunities } from '@dataconnect/generated';


// Call the `listCommunities()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCommunities();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCommunities(dataConnect);

console.log(data.communities);

// Or, you can use the `Promise` API.
listCommunities().then((response) => {
  const data = response.data;
  console.log(data.communities);
});
```

### Using `ListCommunities`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCommunitiesRef } from '@dataconnect/generated';


// Call the `listCommunitiesRef()` function to get a reference to the query.
const ref = listCommunitiesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCommunitiesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.communities);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.communities);
});
```

## GetUserPosts
You can execute the `GetUserPosts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserPosts(options?: ExecuteQueryOptions): QueryPromise<GetUserPostsData, undefined>;

interface GetUserPostsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserPostsData, undefined>;
}
export const getUserPostsRef: GetUserPostsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserPosts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserPostsData, undefined>;

interface GetUserPostsRef {
  ...
  (dc: DataConnect): QueryRef<GetUserPostsData, undefined>;
}
export const getUserPostsRef: GetUserPostsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserPostsRef:
```typescript
const name = getUserPostsRef.operationName;
console.log(name);
```

### Variables
The `GetUserPosts` query has no variables.
### Return Type
Recall that executing the `GetUserPosts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserPostsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserPostsData {
  posts: ({
    title: string;
    content: string;
    community: {
      name: string;
    };
  })[];
}
```
### Using `GetUserPosts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserPosts } from '@dataconnect/generated';


// Call the `getUserPosts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserPosts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserPosts(dataConnect);

console.log(data.posts);

// Or, you can use the `Promise` API.
getUserPosts().then((response) => {
  const data = response.data;
  console.log(data.posts);
});
```

### Using `GetUserPosts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserPostsRef } from '@dataconnect/generated';


// Call the `getUserPostsRef()` function to get a reference to the query.
const ref = getUserPostsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserPostsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.posts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.posts);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreatePost
You can execute the `CreatePost` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPost(vars: CreatePostVariables): MutationPromise<CreatePostData, CreatePostVariables>;

interface CreatePostRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePostVariables): MutationRef<CreatePostData, CreatePostVariables>;
}
export const createPostRef: CreatePostRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPost(dc: DataConnect, vars: CreatePostVariables): MutationPromise<CreatePostData, CreatePostVariables>;

interface CreatePostRef {
  ...
  (dc: DataConnect, vars: CreatePostVariables): MutationRef<CreatePostData, CreatePostVariables>;
}
export const createPostRef: CreatePostRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPostRef:
```typescript
const name = createPostRef.operationName;
console.log(name);
```

### Variables
The `CreatePost` mutation requires an argument of type `CreatePostVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePostVariables {
  title: string;
  content: string;
  communityId: UUIDString;
}
```
### Return Type
Recall that executing the `CreatePost` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePostData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePostData {
  post: Post_Key;
}
```
### Using `CreatePost`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPost, CreatePostVariables } from '@dataconnect/generated';

// The `CreatePost` mutation requires an argument of type `CreatePostVariables`:
const createPostVars: CreatePostVariables = {
  title: ..., 
  content: ..., 
  communityId: ..., 
};

// Call the `createPost()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPost(createPostVars);
// Variables can be defined inline as well.
const { data } = await createPost({ title: ..., content: ..., communityId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPost(dataConnect, createPostVars);

console.log(data.post);

// Or, you can use the `Promise` API.
createPost(createPostVars).then((response) => {
  const data = response.data;
  console.log(data.post);
});
```

### Using `CreatePost`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPostRef, CreatePostVariables } from '@dataconnect/generated';

// The `CreatePost` mutation requires an argument of type `CreatePostVariables`:
const createPostVars: CreatePostVariables = {
  title: ..., 
  content: ..., 
  communityId: ..., 
};

// Call the `createPostRef()` function to get a reference to the mutation.
const ref = createPostRef(createPostVars);
// Variables can be defined inline as well.
const ref = createPostRef({ title: ..., content: ..., communityId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPostRef(dataConnect, createPostVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.post);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.post);
});
```

## CreateMessage
You can execute the `CreateMessage` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMessage(vars: CreateMessageVariables): MutationPromise<CreateMessageData, CreateMessageVariables>;

interface CreateMessageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMessageVariables): MutationRef<CreateMessageData, CreateMessageVariables>;
}
export const createMessageRef: CreateMessageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMessage(dc: DataConnect, vars: CreateMessageVariables): MutationPromise<CreateMessageData, CreateMessageVariables>;

interface CreateMessageRef {
  ...
  (dc: DataConnect, vars: CreateMessageVariables): MutationRef<CreateMessageData, CreateMessageVariables>;
}
export const createMessageRef: CreateMessageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMessageRef:
```typescript
const name = createMessageRef.operationName;
console.log(name);
```

### Variables
The `CreateMessage` mutation requires an argument of type `CreateMessageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateMessageVariables {
  receiverId: UUIDString;
  content: string;
}
```
### Return Type
Recall that executing the `CreateMessage` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMessageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMessageData {
  message: Message_Key;
}
```
### Using `CreateMessage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMessage, CreateMessageVariables } from '@dataconnect/generated';

// The `CreateMessage` mutation requires an argument of type `CreateMessageVariables`:
const createMessageVars: CreateMessageVariables = {
  receiverId: ..., 
  content: ..., 
};

// Call the `createMessage()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMessage(createMessageVars);
// Variables can be defined inline as well.
const { data } = await createMessage({ receiverId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMessage(dataConnect, createMessageVars);

console.log(data.message);

// Or, you can use the `Promise` API.
createMessage(createMessageVars).then((response) => {
  const data = response.data;
  console.log(data.message);
});
```

### Using `CreateMessage`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMessageRef, CreateMessageVariables } from '@dataconnect/generated';

// The `CreateMessage` mutation requires an argument of type `CreateMessageVariables`:
const createMessageVars: CreateMessageVariables = {
  receiverId: ..., 
  content: ..., 
};

// Call the `createMessageRef()` function to get a reference to the mutation.
const ref = createMessageRef(createMessageVars);
// Variables can be defined inline as well.
const ref = createMessageRef({ receiverId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMessageRef(dataConnect, createMessageVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.message);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.message);
});
```

