const graphql = require("graphql");
const fetch = require("node-fetch");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args){
        return fetch(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then(response => response.json())
      }
    }
  }),
})

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: { 
      type: CompanyType,
      resolve(parentValue, args){ //resolves differences between companyId and neccessary companyId
        return fetch(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(response => response.json())
      }
    }
  }),
});

//where the original query starts. Only can query starting with below fields.
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args){
        return fetch(`http://localhost:3000/users/${args.id}`)
          .then(response => response.json())
      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args){
        return fetch(`http://localhost:3000/companies/${args.id}`)
          .then(response => response.json())
      }
    }
  }
});

//root mutation
const mutation = new GraphQLObjectType({
  //change underyling data in some fashion
  name: "Mutation",
  //fields of mutation describe operation
  fields: {
    addUser: {
      //Type --> type of data resolve function will return
      //Not always returning same type as we are working on
      type: UserType,
      args: {
        //GraphQLNonNull asserts that a value must be passed in
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, args){
        return fetch("http://localhost:3000/users", configureAddUser(args))
          .then(response => response.json())
      } 
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parentValue, { id }){
        return fetch(`http://localhost:3000/users/${id}`, configureDeleteUser())
          .then(response => response.json())
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, args){
        return fetch(`http://localhost:3000/users/${args.id}`, configureEditUser(args))
          .then(response => response.json())
      }
    }
    
  }
})

function configureEditUser(args){
  return {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(args)
  }
}

function configureDeleteUser(){
  return {
    method: "DELETE",
    headers: {
      "Content-type": "application/json"
    }
  }
}

function configureAddUser({ firstName, age }){
  return {
    Accept: "application/json",
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      firstName,
      age
    })
  };
}

module.exports = new GraphQLSchema({
  query: RootQuery,
  //root mutation
  mutation,
})


//How to run JSON server:
//npm run json:server