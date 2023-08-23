import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';
import promptSync from 'prompt-sync';

const prompt = promptSync();

const template = (systemContent, userContent, assistantContent) => {
    const _template = `{
        "messages": [
            { "role": "system", "content": "${systemContent}" },
            { "role": "user", "content": "${userContent}" },
            { "role": "assistant", "content": "${assistantContent}" }
        ]
    }`;
    // remove all new line chars to make a valid jsonl
    return _template.replace(/(\r\n|\n|\r)/gm, "");
};

const openAIInput = {
    apiKey: process.env.OPENAI_API_KEY
}

const openai =  new OpenAI(openAIInput);

const systemContent = `You are an assitant who's learning a new Javascript framework called Luvio which is described as: 
    Luvio generates high performance identity-mapping Typescript API clients for RAML-described REST APIs. 
    Luvio is designed to be easy to use and extensible: API clients are configured through RAML annotations, 
    integration points allow custom logic, and generated primitives are composable to create new API clients.

    More details about the framework are below:

    Defining an Adapter: To define an adapter annotate a resource in the RAML file with (luvio.adapter). This annotation requires a name parameter whose value defines the generated adapter name.
    We recommend using a RAML Overlay so the luvio configuration is in a separate file from your API specification. 
    The API specification is often generated or provided by a third-party whereas the luvio configuration is authored by a developer. 
    The files often change at different paces, and by different tools and people, so it's convenient to separate the concerns. We recommend api.raml for the API specification and luvio.raml for the luvio annotations.

    Override Configuration Types: It is often desired for an adapter to accept input values beyond what the API RAML specifies. These alternate input types must be coerced to the API RAML type which is ultimately provided to the network adapter and server API.
    To specify alternate input types augment the (luvio.adapter) annotation with the coercedParams property. coercedParams is a key-value object where the key is a Config property of the adapter, and the value is the Type used in the adapter's Config for the associated property. The Type must be present in the RAML file and it must be annotated with (luvio.coerceFunction).
    The example declares that the id input also accepts a TodoId, which is an object with a single property id.

    types:
    # An alternate input type
    TodoId:
        type: object
        properties:
        id: string

    /todos/{id}:
    get:
        (luvio.adapter):
        name: getTodo
        # id input can be a string or TodoId Type
        coercedParams:
            id: TodoId
    Copy to clipboardErrorCopied
    Coercing Types

    The (luvio.coerceFunction) annotation provides the adapter with a function to coerce a value between types. The annotation defines a relative path to a Typescript module with a default export that is a pure function. The function must accept a single argument that is the non-coerced input value. The function must return either the coerced value (with the type that matches the resource's parameter) or undefined to signal the configuration is incomplete.

    Functions referenced by (luvio.coerceFunction) can receive any user-supplied value. It is important that all coerce functions handle this with defensive programming techniques. It is recommended that all argument types be unknown, not any, to ensure proper handling.
    types:
    TodoId:
        (luvio.coerceFunction): ../types/TodoId/coerce.ts
        type: object
        properties:
        id: string

    Caching: 
    Luvio provides developers fine-grained control of caching behavior. Caching in Luvio rests on defining a data's identity. Data's identity is composed of a name, a namespace, and set of properties. Luvio uses these properties to construct a unique key for a value.
    Understanding cache keys and how they interact is crucial to properly configuring Luvio adapters. There are two different types of keys in Luvio, Resource and Type keys. The relationship of Type keys and Resource keys often confuses people new to Luvio. Both are used to construct cache keys for data, but they operate on different pieces of information.
    A Type key is used to generate the cache key for, and from, data that Luvio is ingesting into its cache. For example, luvio uses Type keys when ingesting data from a network response into the cache. Type keys are derived from the data itself and tell Luvio where to store and subsequently find a given piece of data in its cache.
    A Resource key, on the other hand, is used to locate the data that is needed to satisfy a request to an adapter. A Resource key is built from the Config that is passed to an adapter and tells Luvio where to look in the cache for the data needed to satisfy that adapter request.
    During a single invocation of an adapter, Luvio's generated client will utilize both of these keys.

    Type Caching:
    Luvio supports type-level caching. This means luvio is able to resolve a value of a type in the cache regardless of the resource that returned it. Type caching relies on a type's identity which is composed of the type's name, a namespace, and set of properties present on values of the type. The identity is used to create a unique key for each value of the type. Often type's identity uses a single id property. In more complex cases a type's identity is composed of multiple properties.
    To define a type's key use the (luvio.key) annotation on the type. (luvio.key) accepts an object where the property name is a field on the key itself, and the value specifies a property on the type.
    In the example, the Todo type uses (luvio.key) to define a property called todoid. todoid gets its value from the id property on the Todo value. If a resource needs to create a key for the Todo type it needs to specify a value for todoid.

    types:
    Todo:
        (luvio.key):
        todoid: id
        type: object
        properties:
        title: string
        completed: boolean
        id: string  

    Resource Caching
    Luvio supports type caching from resources. If a resource specifies how to build the type's key for its 200 response code then luvio can inspect its cache for the return value. If luvio's cache has the necessary return value then a network request is avoided.

    This means that luvio can serve values from cache that have been fetched from arbitrary resources. It is not required to have previously made a network request for a resource in order to satisfy the resource from cache!

    Network request to load all Todos
    User initially loads the document. Luvio has to make a network request to fetch all of the Todos.
    No network request needed to load Todo detail
    User clicks on a Todo to edit. Luvio does not need to make any network requests because the relevant Todo is already in the luvio cache.
    To build a type's key from a resource, the resource must map its URI and query parameters to the type's key properties. Use (luvio.key) to define this mapping. (luvio.key) accepts an object where the property name is a field on the key itself, and the value specifies query or URI parameter on the resource.

    For the GET /todos/{id} resource, the urlParams.id maps to Todo type key's todoid property.

    If the /todos/123 resource is requested, luvio first inspects its cache for a Todo value with key todoid of 123.

    If a resource does not specify (luvio.key) then the resource's response is cached using the resource's URI and query parameters. Note that this necessarily implies that data returned from these resources can only be used to satisfy identical future adapter requests and that luvio cannot deliver its usual consistency guarantees for this data. It's a best practice to specify a (luvio.key) for all resources.

    /todos/{id}:
    get:
        (luvio.adapter):
        name: getTodo
        (luvio.key):
        todoid: urlParams.id
        responses:
        200:
            body:
            application/json:
                type: Todo  
    By default, data in luvio is cached forever. To specify a time-to-live value for cache entries use one or more of the build time and runtime configuration options. In the default luvio configuration, a cached value that has exceeded its time-to-live is treated as a cache miss.

    The time-to-live value for a cache entry is determined in this priority:

    Runtime type-specific TTL override
    Runtime default TTL override
    Build time type-specific TTL (in RAML)
    Build time file-specific default TTL (in RAML)
    Cache forever   

    Specify a default time-to-live at the root of the RAML document with the (luvio.ttl) annotation. This applies to all types defined in the file. This annotation accepts a single numeric value: the milliseconds for the time-to-live.

    Specify the time-to-live of individual types using the same (luvio.ttl) annotation but placed on the type.

    The example sets a default time-to-live of 60,000 milliseconds, and the Todo type time-to-live is set as 30,000 milliseconds.
    Note that time-to-live should always be more that 0, this gives our engine the time to store and read data correctly from cache, the minimum value of time-to-live should be 200ms.

    (luvio.ttl): 60000

    types:
    Todo:
        (luvio.key):
        todoid: id
        (luvio.ttl): 30000
        type: object
        properties:
        title: string
        order: number | nil
        completed: boolean
        id: string
        
    Namespacing:
    Type names are unique within an API family. Luvio supports multiple API families so type names may conflict which can lead to type identity conflicts. Use the (luvio.keyPrefix) annotation to prevent Type name conflicts.

    uses:
    luvio: luvio://annotations.raml

    (luvio.keyPrefix): 'todoapi' 
    `;

const userContent = `Do you understand luvio framework, explain what did you learn and how to use the luvio framework and each of it's annotation.`;

async function writeToFile(path = 'training.jsonl', content) {
    const done = await fs.writeFile(path, content, err => {
        if(err) {
            console.error(err);
        }
        console.log(`File written succesfully at: ${path} `, done);
    });
}

async function getResponse() {
    try {
        const response = await openai.chat.completions.create({
            "model": "ft:gpt-3.5-turbo-0613:personal::7qbetEgO",
            "temperature": 1,
            "messages": [
                {
                    "role": "system",
                    "content": systemContent
                },
                {
                    "role": "user",
                    "content": userContent
                }
            ]
        });
        console.log(`Reply: `, response);
        console.table(response.choices, ["message"]);
        return response.choices[0].message.content;
    } catch (error) {
        console.log(`Error getting reply: `, error);
    }
}

const iterations = prompt('How many iterations do you want to do? ');

async function generateData() {
    let data = '';
    for (let i=0; i<Number(iterations); i++) {
        data = `${data}${template(systemContent, userContent, await getResponse())}\n`;
    }
    console.log(`Writing to file: `,data);
    writeToFile(undefined, data);
}

generateData();