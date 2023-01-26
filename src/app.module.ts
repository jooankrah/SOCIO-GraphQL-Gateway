import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { Module, UnauthorizedException } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';

const handleAuth = ({ req }) => {
  try {
    if (req.headers.authorization || req.headers.Authorization) {
      return {
        authorization: req.headers.authorization || req.headers.Authorization,
      };
      // return {
      //   userId: decoded.userId,
      //   permissions: decoded.permissions,
      //   authorization: `${req.headers.authorization}`,
      // };
    }
  } catch (err) {
    throw new UnauthorizedException(
      'User unauthorized with invalid authorization Headers',
    );
  }
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // ... Apollo server options
        cors: true,
        playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault],
        context: handleAuth,
      },
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'users', url: 'http://localhost:3002/graphql' },
            // { name: 'posts', url: 'http://post-service/graphql' },
          ],
        }),
        buildService: ({ name, url }) => {
          return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }) {
              request.http.headers.set('authorization', context.authorization);
            },
          });
        },
      },
    }),
  ],
})
export class AppModule {}
