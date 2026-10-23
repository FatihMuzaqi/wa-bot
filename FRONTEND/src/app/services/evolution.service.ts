import { api, unwrap } from '../api/http';

export const evolutionService = {
  status: (instanceName = 'default') => unwrap(api.get(`/evolution/instances/${instanceName}/status`)),
  qr: (instanceName = 'default') => unwrap(api.get(`/evolution/instances/${instanceName}/qr`)),
};
