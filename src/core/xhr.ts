import { AxiosRequestConfig, AxiosResponse, AxiosPromise, AxiosError } from '../types'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'
import { isURLSameOrigin } from '../helpers/url'
import cookie from '../helpers/cookie'
import { isFormData } from '../helpers/util'

export default function xhr(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((res, rej) => {
    const { data = null, method = 'GET', url, headers,
    responseType, timeout, cancelToken, withCredentials,
    xsrfCookieName, xsrfHeaderName, onDownloadProgress,
    onUploadProgress, auth, validateStatus } = config

    const request = new XMLHttpRequest()

    request.open(method.toUpperCase(), url!, true)

    configureRequest()

    addEvents()

    processHeaders()

    processCancel()

    request.send(data)

    function configureRequest() {
      if (withCredentials) {
        request.withCredentials = true
      }

      if (responseType) {
        request.responseType = responseType
      }

      if (timeout) {
        request.timeout = timeout
      }
    }

    function addEvents() {
      if (onDownloadProgress) {
        request.onprogress = onDownloadProgress
      }

      if (onUploadProgress) {
        request.upload.onprogress = onUploadProgress
      }

      request.ontimeout = () => {
        rej(createError(
          `Timeout of ${config.timeout} ms exceeded`,
          config,
          'ECONNABORTED',
          request
        ))
      }

      request.onerror = () => {
        rej(createError(
          'Network Error',
          config,
          null,
          request
        ))
      }

      request.onreadystatechange = function handleLoad() {
        if (request.readyState !== 4) {
          return
        }

        if (request.status === 0) {
          return
        }

        const responseHeaders = parseHeaders(request.getAllResponseHeaders())
        const responseData = responseType && responseType !== 'text' ? request.response : request.responseText
        const response: AxiosResponse = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config,
          request
        }
        handleResponse(response)
        res(response)
      }
    }

    function processHeaders(): void {
      if ((withCredentials || isURLSameOrigin(url!)) && xsrfCookieName) {
        const xsrfValue = cookie.read(xsrfCookieName)
        if (xsrfValue) {
          headers[xsrfHeaderName!] = xsrfValue
        }
      }

      if (isFormData(data)) {
        delete headers['Content-Type']
      }

      if (auth) {
        headers['Authorization'] = 'Basic ' + btoa(auth.username + ':' + auth.password)
      }

      Object.keys(headers).forEach((name) => {
        if (data === null && name.toLowerCase() === 'content-type') {
          delete headers[name]
        } else {
          request.setRequestHeader(name, headers[name])
        }
      })
    }

    function processCancel() {
      if (cancelToken) {
        cancelToken.promise.then(reason => {
          request.abort()
          rej(reason)
        })
      }
    }

    function handleResponse(response: AxiosResponse) {
      if (!validateStatus || validateStatus(response.status)) {
        res(response)
      } else {
        rej(createError(
          `Request failed with status code ${response.status}`,
          config,
          null,
          request,
          response
        ))
      }
    }
  })
}

