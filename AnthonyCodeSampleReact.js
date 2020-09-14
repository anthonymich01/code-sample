import React from "react"
import { connect } from "react-redux"
import { setOrderHistoryTab, getMoreOrderHistory } from "@Actions/profilePageActions"
import moment from "moment"
import NumberFormat from "react-number-format"
import { cancelOrderAPI } from "@Http/api"
import Router from "next/router"
import Link from "next/link"
import * as LINK from "@Constants/link"
import * as COLOR from "@Constants/color"
import { OrderTransactionPerPage } from "@Constants/variables"
import { LoadingSegment, RenderEmptyCoursesUser } from "@Components/RenderComponents"
import { Divider, Icon, Table, Menu, Modal, Button, Popup, Segment } from "semantic-ui-react"
import style from "./style.scss"

const orderStatusTitle = {
  semua: ["Semua Pesanan", null],
  pending: ["Pesanan Pending", "PENDING"],
  dibayar: ["Pesanan Dibayar", "PAID"],
  selesai: ["Pesanan Selesai", "COMPLETED"],
  dibatalkan: ["Pesanan Dibatalkan", "CANCELED"],
  kadaluarsa: ["Pesanan Kadaluarsa", "EXPIRED"]
}

const orderStatusColor = {
  PAID: { color: COLOR.BLUE },
  PENDING: { color: COLOR.BLACK },
  COMPLETED: { color: COLOR.BLUE },
  CANCELED: { color: COLOR.RED },
  EXPIRED: { color: COLOR.RED }
}

const orderStatusName = {
  PAID: "Sudah Dibayar",
  PENDING: "Belum Dibayar",
  COMPLETED: "Selesai",
  CANCELED: "Dibatalkan",
  EXPIRED: "Kadaluarsa"
}

const RenderOrderHistory = ({ order, tab, cancelOrderHandler }) => {
  const title = orderStatusTitle[tab][0]

  return (
    <>
      <h2>{title}</h2>
      <Table singleLine>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell textAlign="center">Tanggal</Table.HeaderCell>
            <Table.HeaderCell>Order Invoice</Table.HeaderCell>
            <Table.HeaderCell>Kelas</Table.HeaderCell>
            <Table.HeaderCell>Jumlah</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Status</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {order.map((v, i) => {
            const courseTitles = v.courses.map((val, idx) => {
              return (
                <>
                  <Link
                    href={
                      v.order_status === "COMPLETED" || v.order_status === "PAID"
                        ? LINK.KELAS_COURSE_ATTEND
                        : LINK.KELAS_COURSE
                    }
                    as={
                      v.order_status === "COMPLETED" || v.order_status === "PAID"
                        ? `/kelas/${val.course_uuid}/attend`
                        : `${LINK.KELAS}/${val.course_uuid}`
                    }
                  >
                    <a>{val.title}</a>
                  </Link>
                  {idx === v.courses.length - 1 && <br />}
                </>
              )
            })

            return (
              <Table.Row key={i}>
                <Table.Cell textAlign="center">{moment(v.updated_at).format("D MMM")}</Table.Cell>
                <Table.Cell collapsing>
                  <div className={style.tableOrderInvoice}>
                    <Icon name="list alternate outline" color="blue" size="large" /> {v.order_uuid}
                  </div>
                </Table.Cell>
                <Table.Cell collapsing>
                  <div className={style.tableCourseTitle}>{courseTitles}</div>
                </Table.Cell>
                <Table.Cell>
                  <b>
                    <NumberFormat
                      value={v.total_payment}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                    />
                  </b>
                </Table.Cell>
                <Table.Cell
                  textAlign="center"
                  style={orderStatusColor[v.order_status]}
                  className={style.orderStatus}
                >
                  {orderStatusName[v.order_status]}
                </Table.Cell>
                <Table.Cell textAlign="center" collapsing>
                  {v.order_status === "PENDING" && (
                    <>
                      <Link href={LINK.ORDER_THANKS_VARIANT} as={`${LINK.ORDER_THANKS}/${v.order_uuid}`}>
                        <a>
                          <Popup
                            content="Bayar Sekarang"
                            position="top center"
                            size="small"
                            inverted
                            trigger={<Icon name="dollar sign" color="blue" className={style.pendingIcon} />}
                          />
                        </a>
                      </Link>
                      <Modal
                        size="tiny"
                        trigger={
                          <Icon
                            name="close"
                            color="red"
                            className={style.pendingIcon}
                            title="Batalkan Pesanan"
                          />
                        }
                      >
                        <Modal.Header className={style.cancelModalHeader}>Batalkan Pesanan</Modal.Header>
                        <Modal.Content>
                          <p className={style.cancelModalText}>
                            Apakah kamu yakin untuk membatalkan pesanan
                            <br />
                            <span className={style.courseTitlesModal}>{courseTitles}</span>
                            <br />
                            <br />
                            Invoice
                            <br />
                            <b>{v.order_uuid}</b>
                          </p>
                        </Modal.Content>
                        <Modal.Actions className={style.cancelModalActions}>
                          <Button
                            icon="close"
                            labelPosition="right"
                            content="Batalkan Pesanan"
                            color="red"
                            className={style.cancelModalButton}
                            onClick={() => cancelOrderHandler(v.order_uuid)}
                          />
                        </Modal.Actions>
                      </Modal>
                    </>
                  )}
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </>
  )
}

class ProfileTransaction extends React.Component {
  constructor(props) {
    super(props)

    Router.events.on("routeChangeComplete", this.handleRouteChange)
    this.state = { actTab: "semua", page: 1 }
  }

  handleTab = (e, { name }) => {
    this.setState({ actTab: name, page: 1 })
    this.props.dispatch(setOrderHistoryTab(1, OrderTransactionPerPage, orderStatusTitle[name][1]))
  }

  handleLoadMoreTransactions = () => {
    const newPage = this.state.page + 1
    this.setState({ page: newPage })
    this.props.dispatch(
      getMoreOrderHistory(newPage, OrderTransactionPerPage, orderStatusTitle[this.state.actTab][1])
    )
  }

  handleRouteChange = () => {
    this.setState({ actTab: "semua", page: 1 })
  }

  cancelOrderHandler = async (uuid) => {
    try {
      const response = await cancelOrderAPI(uuid)
      if (response.status === 200) {
        console.log(`Order ${uuid} Canceled.`)
        Router.push(LINK.PROFILE_SLUG, LINK.PROFILE_PEMBELIAN)
      }
    } catch (e) {
      console.log(e)
    }
  }

  render() {
    const { order, isLoading, isMoreOrdersLoading } = this.props
    const { actTab, page } = this.state
    const newOrdersLength = page * OrderTransactionPerPage

    return (
      <>
        <h3>
          <Icon name="tags" /> Pembelian
        </h3>
        <Divider />
        <Menu color="blue" tabular>
          <Menu.Item name="semua" active={actTab === "semua"} onClick={this.handleTab} />
          <Menu.Item name="pending" active={actTab === "pending"} onClick={this.handleTab} />
          <Menu.Item name="dibayar" active={actTab === "dibayar"} onClick={this.handleTab} />
          <Menu.Item name="selesai" active={actTab === "selesai"} onClick={this.handleTab} />
          <Menu.Item name="dibatalkan" active={actTab === "dibatalkan"} onClick={this.handleTab} />
          <Menu.Item name="kadaluarsa" active={actTab === "expired"} onClick={this.handleTab} />
        </Menu>
        {isLoading ? (
          <LoadingSegment />
        ) : order.length > 0 ? (
          <>
            <RenderOrderHistory order={order} tab={actTab} cancelOrderHandler={this.cancelOrderHandler} />
            <p
              className={style.loadMoreButtonP}
              style={!isMoreOrdersLoading && order.length < newOrdersLength ? { display: "none" } : {}}
            >
              <button
                type="button"
                title="Load More"
                className={`ui large icon button circular ${style.loadMoreButton} ${
                  isMoreOrdersLoading ? "loading disabled" : ""
                }`}
                onClick={this.handleLoadMoreTransactions}
              >
                <i aria-hidden="true" className={`${!isMoreOrdersLoading && "angle down"} icon`} />
              </button>
            </p>
          </>
        ) : (
          <Segment>
            <RenderEmptyCoursesUser />
          </Segment>
        )}
      </>
    )
  }
}

const mapStateToProps = (state) => {
  const { order, isLoading, isMoreOrdersLoading } = state.profile
  return { order, isLoading, isMoreOrdersLoading }
}

export default connect(mapStateToProps)(ProfileTransaction)
