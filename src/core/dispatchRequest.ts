import { AxiosRequestConfig, AxiosPromise, AxiosResponse } from '../types/index'
import { bulidURL } from '../helpers/url'
import { transformRequest, transformResponse } from '../helpers/data'
import { processHeaders } from '../helpers/headers'
import xhr from './xhr'
function axios (config: AxiosRequestConfig): AxiosPromise {
  processConfig(config)
  return xhr(config).then((res) => {
    return transformResponseData(res)
  })
}

function transformResponseData(res: AxiosResponse): AxiosResponse {
  res.data = transformResponse(res.data)
  return res
}

function processConfig (config: AxiosRequestConfig): void {
  config.url = transformUrl(config)
  config.headers = transformHeaders(config)
  config.data = transformRequestData(config)
}

function transformUrl (config: AxiosRequestConfig): string {
  const { url, params } = config
  return bulidURL(url, params)
}

function transformHeaders (config: AxiosRequestConfig) {
  const { headers = {}, data } = config
  return processHeaders(headers, data)
}


function transformRequestData (config: AxiosRequestConfig): any {
  return transformRequest(config.data)
}


export default axios