const express = require('express')
const request = require('supertest')
const Cart = require('../server/models/cart')
const Product = require('../server/models/product')
const CartRouter = require('../server/routes/api/cart')

const app = express()
app.use(express.json())
app.use('/', CartRouter)

jest.mock('../server/middleware/auth', () => (req, res, next) => {
  req.user = {
    _id: 'user123'
  }
  next()
})
jest.mock('../server/models/product', () => {
  return {
    bulkWrite: jest.fn()
  }
})
jest.spyOn(Cart, 'updateOne')
jest.spyOn(Cart, 'deleteOne')
jest.spyOn(Cart.prototype, 'save')

afterEach(() => {
  jest.clearAllMocks()
})


describe('POST /add', () => {
  it('deve adicionar um novo carrinho', async () => {
    const mockedSave = Cart.prototype.save
    mockedSave.mockReturnValue({id: 'cart123'})

    const response = await request(app).post('/add').send({
      products: [
        {
          product: 'product123',
          quantity: 2
        }
      ]
    }).expect(200)

    expect(response.body).toEqual({
      success: true,
      cartId: 'cart123',
    })
    expect(mockedSave).toHaveBeenCalled()
  })

  it('deve retornar um erro 400 se houver um erro ao adicionar um novo carrinho', async () => {
    const mockedSave = Cart.prototype.save
    mockedSave.mockRejectedValueOnce(new Error('Erro ao adicionar carrinho'))

    const response = await request(app).post('/add').send({
      products: [
        {
          product: 'product123',
          quantity: 2
        }
      ]
    }).expect(400)

    expect(response.body).toEqual({
      error: 'Your request could not be processed. Please try again.'
    })
    expect(mockedSave).toHaveBeenCalled()
  })
})


describe('DELETE /delete/:cartId', () => {
  it('deve deletar o carrinho', async () => {
    const mockedDeleteOne = Cart.deleteOne
    mockedDeleteOne.mockReturnValue({exec: () => null})

    const cartId = 'cart123'
    const response = await request(app).delete(`/delete/${cartId}`).expect(200)

    expect(mockedDeleteOne).toHaveBeenCalledWith({ _id: cartId })

    expect(response.body).toEqual({ success: true })
  })

  it('deve retornar um erro 400 se houver um erro ao deletar o carrinho', async () => {
    const mockedDeleteOne = Cart.deleteOne
    mockedDeleteOne.mockRejectedValueOnce(new Error('Erro ao deletar carrinho'))

    const cartId = 'cart123'
    const response = await request(app).delete(`/delete/${cartId}`).expect(400)

    expect(response.body).toEqual({
      error: 'Your request could not be processed. Please try again.'
    })
  })
})


const mockProduct = {
  sku: 'test',
  name: 'test',
  slug: 'test',
  imageUrl: 'test',
  imageKey: 'test',
  description: 'test',
  quantity: 1,
  price: 1,
  taxable: true,
  isActive: true,
  brand: 'test',
  updated: Date.now(),
  created: Date.now()
}

describe('POST /add/:cartId', () => {
  it('deve adicionar um novo produto ao carrinho', async () => {
    const mockedUpdateOne = Cart.updateOne
    mockedUpdateOne.mockReturnValue({exec: () => null})

    const cartId = 'cart123'
    const response = await request(app).post(`/add/${cartId}`).send({
      product: mockProduct
    }).expect(200)

    expect(mockedUpdateOne).toHaveBeenCalledWith(
      { _id: cartId },
      { $push: { products: mockProduct } }
    )

    expect(response.body).toEqual({ success: true })
  })

  it('deve retornar um erro 400 se houver um erro ao adicionar um novo produto ao carrinho', async () => {
    const mockedUpdateOne = Cart.updateOne
    mockedUpdateOne.mockReturnValue({exec: () => {throw new Error('Erro ao adicionar produto')}})

    const cartId = 'cart123'
    const response = await request(app).post(`/add/${cartId}`).send({
      product: 'product123',
      quantity: 2
    }).expect(400)

    expect(response.body).toEqual({
      error: 'Your request could not be processed. Please try again.'
    })
  })
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
    mockedUpdateOne.mockReturnValue({exec: () => {throw new Error('Erro ao deletar produto')}})

    const cartId = 'cart123'
    const productId = 'product123'
    const response = await request(app).delete(`/delete/${cartId}/${productId}`).expect(400)

    expect(response.body).toEqual({
      error: 'Your request could not be processed. Please try again.'
    })
  })
})


describe('decreaseQuantity auxiliar function', () => {
  it('deve diminuir a quantidade de produtos', async () => {
    const mockedBulkWrite = Product.bulkWrite
    mockedBulkWrite.mockReturnValue({exec: () => null})

    const products = [mockProduct]
    await CartRouter.decreaseQuantity(products)

    expect(mockedBulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { _id: products[0].product },
          update: { $inc: { quantity: -products[0].quantity } }
        }
      }
    ])
  })
})
