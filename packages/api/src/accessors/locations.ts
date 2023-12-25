import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import { LocalLibrary } from '../api/LocalLibrary.js';

export function createLocationsAccessor(hosts: string[]) {
  // TODO: for hosts, create api instance(s)

  const api = new LocalLibrary();

  return new Accessor(api, {
    createRequest(params: {
      query: {
        path: string;
        name: string;
      };
    }) {
      return {
        _type: MessageType.Locations,
      };
      // return {
      //   _type: MessageType.MutateLocations,
      //   path: params.path,
      //   name: params.name,
      // };
    },

    handleMessage(msg) {
      if (msg._type === MessageType.Locations) return msg;
    },

    filter: ([data]) => data,
  });
}
