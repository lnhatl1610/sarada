import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../test/server'
import { fetchCatalogProductPage } from './catalog-api'

describe('catalog API client', () => {
  it('sends URL filters and pagination to the products endpoint', async () => {
    let requestUrl = ''
    server.use(
      http.options(/\/api\/v1\/products$/, () => new HttpResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'accept,x-request-id',
        },
      })),
      http.get(/\/api\/v1\/products$/, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json({ data: [], links: {}, meta: { current_page: 2 } }, {
          headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true',
          },
        })
      }),
    )

    const page = await fetchCatalogProductPage('?q=linen&page=2&sort=price_asc')
    const params = new URL(requestUrl).searchParams

    expect(page.data).toEqual([])
    expect(params.get('q')).toBe('linen')
    expect(params.get('page')).toBe('2')
    expect(params.get('sort')).toBe('price_asc')
  })
})
