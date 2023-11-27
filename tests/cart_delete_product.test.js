const express = require('express')
const request = require('supertest')
const Cart = require('../server/models/cart')
const CartRouter = require('../server/routes/api/cart')

const app = express()
app.use(express.json())
app.use('/', CartRouter)

jest.mock('../server/middleware/auth', () => (req, res, next) => next())
jest.spyOn(Cart, 'updateOne')

afterEach(() => {
  jest.clearAllMocks()
})

describe('DELETE /delete/:cartId/:productId', () => {
  it('deve deletar o produto do carrinho', async () => {
    const mockedUpdateOne = Cart.updateOne
    mockedUpdateOne.mockReturnValue({exec: () => null})

    const cartId = 'cart123'
    const productId = 'product123'

    const response = await request(app).delete(`/delete/${cartId}/${productId}`).expect(200)

    expect(mockedUpdateOne).toHaveBeenCalledWith(
      { _id: cartId },
      { $pull: { products: { product: productId } } }
    )

    expect(response.body).toEqual({ success: true })
  })

  it('deve retornar um erro 400 se houver um erro ao deletar o produto do carrinho', async () => {
    const mockedUpdateOne = Cart.updateOne
    // new Error('Erro ao deletar produto')
    mockedUpdateOne.mockReturnValue({exec: () => {throw new Error('Erro ao deletar produto')}})

    const cartId = 'cart123'
    const productId = 'product123'

    const response = await request(app).delete(`/delete/${cartId}/${productId}`).expect(400)

    expect(response.body).toEqual({
      error: 'Your request could not be processed. Please try again.',
    })
  })
})
