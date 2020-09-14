import React from "react"
import axios from "axios"
import {
  IonAlert,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  withIonLifeCycle
} from "@ionic/react"
import { addOutline, removeOutline, trashOutline } from "ionicons/icons"
import { WP_COCART_CART, WP_COCART_ITEM, WP_COCART_CART_TOTAL } from "../../constant/api"
import { generateAuthorizationHeader } from "../../util/common"
import LoadingSpinner from "../../components/LoadingSpinner"

type CartDatum = {
  productId: Number
  variationId: Number
  productTitle: String
  productPrice: Number
  productImage: String
  key: String
  qty: Number
}

type CartState = {
  showLoadingSpinner: Boolean
  carts: Array<CartDatum>

  subtotalCharge: Number

  showConfirmDeleteItemDialog: Boolean
  cartItemKeyThatWillBeDeleted?: String
}

class Cart extends React.Component<any, CartState> {
  state = {
    showLoadingSpinner: true,
    carts: [],

    subtotalCharge: 0,

    showConfirmDeleteItemDialog: false,
    cartItemKeyThatWillBeDeleted: undefined
  }

  ionViewWillEnter = async (): Promise<void> => {
    const cartResponse = await axios.get(WP_COCART_CART, {
      headers: {
        Authorization: generateAuthorizationHeader()
      },
      params: {
        thumb: true
      }
    })
    const carts: Array<CartDatum> = this.createCartsStateDataFromResponse(cartResponse.data)

    const cartTotalResponse = await axios.get(WP_COCART_CART_TOTAL, {
      headers: {
        Authorization: generateAuthorizationHeader()
      }
    })

    this.setState({
      carts,
      showLoadingSpinner: false,
      subtotalCharge: parseInt(cartTotalResponse.data.subtotal)
    })
  }

  createCartsStateDataFromResponse = (cartResponse: any) => {
    return Object.keys(cartResponse).map(
      (value: String): CartDatum => {
        return {
          productTitle: cartResponse[`${value}`].product_title,
          productPrice: cartResponse[`${value}`].line_total,
          productImage: cartResponse[`${value}`].product_image,
          key: value,
          qty: cartResponse[`${value}`].quantity,
          productId: cartResponse[`${value}`].product_id,
          variationId: cartResponse[`${value}`].variation_id
        }
      }
    )
  }

  handleOnClickCheckoutButton = () => {
    this.props.history.push({
      pathname: "/checkout",
      state: {
        carts: this.state.carts,
        subtotalCharge: this.state.subtotalCharge
      }
    })
  }

  handleOnClickDeleteCart = async (cartItemKey: String) => {
    const latestCartFromResponse = await axios.delete(WP_COCART_ITEM, {
      headers: {
        Authorization: generateAuthorizationHeader()
      },
      data: {
        cart_item_key: cartItemKey,
        return_cart: true
      }
    })
    const carts = this.createCartsStateDataFromResponse(latestCartFromResponse.data)

    const cartTotalResponse = await axios.get(WP_COCART_CART_TOTAL, {
      headers: {
        Authorization: generateAuthorizationHeader()
      }
    })

    this.setState({
      carts,
      showConfirmDeleteItemDialog: false,
      subtotalCharge: parseInt(cartTotalResponse.data.subtotal)
    })
  }

  updateCartList = async (changedCartItemKey: String, newQty: Number) => {
    const latestCartFromResponse = await axios.post(
      WP_COCART_ITEM,
      {
        cart_item_key: changedCartItemKey,
        quantity: newQty,
        return_cart: true
      },
      {
        headers: {
          Authorization: generateAuthorizationHeader()
        }
      }
    )
    const carts = this.createCartsStateDataFromResponse(latestCartFromResponse.data)

    const cartTotalResponse = await axios.get(WP_COCART_CART_TOTAL, {
      headers: {
        Authorization: generateAuthorizationHeader()
      }
    })

    this.setState({ carts, subtotalCharge: parseInt(cartTotalResponse.data.subtotal) })
  }

  handleOnClickAddOrRemoveItem = async (cartItemKey: String, currentQty: Number, addition: Number) => {
    if (currentQty.valueOf() + addition.valueOf() === 0) {
      // remove item from cart
      this.setState({ cartItemKeyThatWillBeDeleted: cartItemKey, showConfirmDeleteItemDialog: true })
    } else {
      await this.updateCartList(cartItemKey, currentQty.valueOf() + addition.valueOf())
    }
  }

  handleOnChangeQtyFromInput = async (cartItemKey: String, newQty: Number) => {
    if (newQty.valueOf() === 0) {
      // remove item from cart
      this.setState({ cartItemKeyThatWillBeDeleted: cartItemKey, showConfirmDeleteItemDialog: true })
    } else {
      await this.updateCartList(cartItemKey, newQty)
    }
  }

  renderCarts = () => {
    const { carts } = this.state

    if (carts.length > 0) {
      return (
        <IonGrid>
          <IonRow>
            <IonList>
              {carts.map((c: CartDatum) => (
                <IonItem key={`${c.key}`}>
                  <IonGrid>
                    <IonRow>
                      <IonCol>Title : {c.productTitle}</IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol>
                        <IonButton
                          onClick={() => {
                            this.handleOnClickAddOrRemoveItem(c.key, c.qty, -1)
                          }}
                        >
                          <IonIcon icon={removeOutline} />
                        </IonButton>
                      </IonCol>
                      <IonCol>
                        <IonInput
                          value={c.qty.valueOf()}
                          type="number"
                          inputmode="numeric"
                          debounce={250}
                          onIonChange={(e) => {
                            this.handleOnChangeQtyFromInput(c.key, parseInt(e.detail.value!))
                          }}
                        />
                      </IonCol>
                      <IonCol>
                        <IonButton
                          onClick={() => {
                            this.handleOnClickAddOrRemoveItem(c.key, c.qty, 1)
                          }}
                        >
                          <IonIcon icon={addOutline} />
                        </IonButton>
                      </IonCol>
                      <IonCol>
                        <IonButton
                          onClick={() => {
                            this.setState({
                              cartItemKeyThatWillBeDeleted: c.key,
                              showConfirmDeleteItemDialog: true
                            })
                          }}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol>{`Price : Rp ${c.productPrice}`}</IonCol>
                    </IonRow>
                  </IonGrid>
                </IonItem>
              ))}
            </IonList>
          </IonRow>

          <IonRow>
            <IonCol>
              <h4>Subtotal : Rp {this.state.subtotalCharge}</h4>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonButton expand="block" onClick={this.handleOnClickCheckoutButton}>
                Checkout
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      )
    }

    return <h3>Cart is empty</h3>
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Cart</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.state.showLoadingSpinner ? <LoadingSpinner /> : this.renderCarts()}
          <IonAlert
            isOpen={this.state.showConfirmDeleteItemDialog}
            message="Are you sure you want to delete this item?"
            backdropDismiss={false}
            buttons={[
              {
                text: "No",
                cssClass: "secondary",
                handler: () => {
                  this.setState({ showConfirmDeleteItemDialog: false })
                }
              },
              {
                text: "Yes",
                handler: () => {
                  this.handleOnClickDeleteCart(this.state.cartItemKeyThatWillBeDeleted!)
                }
              }
            ]}
          />
        </IonContent>
      </IonPage>
    )
  }
}

export default withIonLifeCycle(Cart)
