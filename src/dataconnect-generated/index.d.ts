import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Community_Key {
  id: UUIDString;
  __typename?: 'Community_Key';
}

export interface CreateMessageData {
  message: Message_Key;
}

export interface CreateMessageVariables {
  receiverId: UUIDString;
  content: string;
}

export interface CreatePostData {
  post: Post_Key;
}

export interface CreatePostVariables {
  title: string;
  content: string;
  communityId: UUIDString;
}

export interface GetUserPostsData {
  posts: ({
    title: string;
    content: string;
    community: {
      name: string;
    };
  })[];
}

export interface ListCommunitiesData {
  communities: ({
    name: string;
    description: string;
    creator: {
      displayName: string;
    };
  })[];
}

export interface Membership_Key {
  id: UUIDString;
  __typename?: 'Membership_Key';
}

export interface Message_Key {
  id: UUIDString;
  __typename?: 'Message_Key';
}

export interface Post_Key {
  id: UUIDString;
  __typename?: 'Post_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreatePostRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePostVariables): MutationRef<CreatePostData, CreatePostVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePostVariables): MutationRef<CreatePostData, CreatePostVariables>;
  operationName: string;
}
export const createPostRef: CreatePostRef;

export function createPost(vars: CreatePostVariables): MutationPromise<CreatePostData, CreatePostVariables>;
export function createPost(dc: DataConnect, vars: CreatePostVariables): MutationPromise<CreatePostData, CreatePostVariables>;

interface CreateMessageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMessageVariables): MutationRef<CreateMessageData, CreateMessageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMessageVariables): MutationRef<CreateMessageData, CreateMessageVariables>;
  operationName: string;
}
export const createMessageRef: CreateMessageRef;

export function createMessage(vars: CreateMessageVariables): MutationPromise<CreateMessageData, CreateMessageVariables>;
export function createMessage(dc: DataConnect, vars: CreateMessageVariables): MutationPromise<CreateMessageData, CreateMessageVariables>;

interface ListCommunitiesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCommunitiesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCommunitiesData, undefined>;
  operationName: string;
}
export const listCommunitiesRef: ListCommunitiesRef;

export function listCommunities(options?: ExecuteQueryOptions): QueryPromise<ListCommunitiesData, undefined>;
export function listCommunities(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCommunitiesData, undefined>;

interface GetUserPostsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserPostsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserPostsData, undefined>;
  operationName: string;
}
export const getUserPostsRef: GetUserPostsRef;

export function getUserPosts(options?: ExecuteQueryOptions): QueryPromise<GetUserPostsData, undefined>;
export function getUserPosts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserPostsData, undefined>;

