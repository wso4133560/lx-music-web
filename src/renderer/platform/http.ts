type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

interface JsonRequestInit extends Omit<RequestInit, 'body'> {
  body?: JsonValue | Record<string, unknown>
}

export const requestJson = async<T>(input: RequestInfo | URL, init: JsonRequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers)
  let body = init.body as BodyInit | undefined
  if (init.body != null) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.body)
  }
  const response = await fetch(input, {
    ...init,
    headers,
    body,
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
