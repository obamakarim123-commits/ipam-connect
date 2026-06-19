# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createPost, createMessage, listCommunities, getUserPosts } from '@dataconnect/generated';


// Operation CreatePost:  For variables, look at type CreatePostVars in ../index.d.ts
const { data } = await CreatePost(dataConnect, createPostVars);

// Operation CreateMessage:  For variables, look at type CreateMessageVars in ../index.d.ts
const { data } = await CreateMessage(dataConnect, createMessageVars);

// Operation ListCommunities: 
const { data } = await ListCommunities(dataConnect);

// Operation GetUserPosts: 
const { data } = await GetUserPosts(dataConnect);


```