import { writeFileSync } from 'fs'

const WOO_URL = 'https://centrumrolnictwa.pl'
const CK = 'ck_be70934407ba53f0d586afc93b6d659d864c1d53'
const CS = 'cs_a6febd74dba4c428065c4fc1ff7ffb91f650fd03'
const PER_PAGE = 100
const FIELDS = 'sku,price,regular_price'

const wynik = []
let page = 1
let totalPages = null

console.log('Pobieram produkty z WooCommerce...')

while (true) {
  const url = WOO_URL + '/wp-json/wc/v3/products'
    + '?per_page=' + PER_PAGE + '&page=' + page
    + '&_fields=' + FIELDS
    + '&consumer_key=' + CK + '&consumer_secret=' + CS

  let res
  try {
    res = await fetch(url)
  } catch (e) {
    console.error('Blad sieci na stronie ' + page + ': ' + e.message + '. Ponawiam za 5s...')
    await new Promise(r => setTimeout(r, 5000))
    continue
  }

  if (!res.ok) {
    console.error('HTTP ' + res.status + ' na stronie ' + page + ': ' + (await res.text()))
    break
  }

  if (totalPages === null) {
    totalPages = parseInt(res.headers.get('x-wp-totalpages') || '0', 10)
    console.log('Lacznie stron: ' + totalPages)
  }

  const batch = await res.json()
  if (!Array.isArray(batch) || batch.length === 0) break

  for (const p of batch) {
    const cena = p.price || p.regular_price
    if (!p.sku || !cena) continue
    if (/^grid/i.test(p.sku)) continue
    wynik.push({ sku: p.sku, brutto: parseFloat(cena) })
  }

  if (page % 20 === 0 || page === totalPages) {
    console.log('  strona ' + page + '/' + totalPages + ' - zebrano ' + wynik.length + ' cen')
  }

  if (page >= totalPages) break
  page++
}

writeFileSync('ceny-woo.json', JSON.stringify(wynik))
console.log('')
console.log('GOTOWE. Zapisano ' + wynik.length + ' cen do ceny-woo.json')
