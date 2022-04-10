/** @odoo-module **/

const {Component} = owl;
import {Mutex} from "@web/core/utils/concurrency";
import core from 'web.core';
const {useState, useExternalListener} = owl.hooks;
import {useEffect, useService} from "@web/core/utils/hooks";


export class ProductDetails extends Component {

    constructor(...args) {
        super(...args);
        this.state = useState({part: {}, part_available: false, popup_visible: false})
    }

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.mutex = new Mutex();
        core.bus.on('barcode_scanned', this, this.onBarcodeScanned);
        this.rpcService = useService("rpc");
        this.notificationService = useService("notification");

    }

    onBarcodeScanned(barcode) {
        this.mutex.exec(async () => {
            let scanned_part = await this.getProductData(barcode)
            if(scanned_part.length>0){
                await this.getData(scanned_part)
            }
            else{
                this.notificationService.add("Barcode not found", {
                        title: "Error",
                        type: "danger",
                    });
            }
        })
    }
     willUnmount() {
        core.bus.off('barcode_scanned', this, this.onBarcodeScanned);
    }

// "display_name","default_code","weight","list_price","qty_available","image_512"
    getProductData = async (barcode) => {
        return await this.orm.searchRead("product.product", [["barcode", "=", barcode]], ["id", "detailed_type", "default_code", "categ_id", "weight", "list_price", "display_name"], {limit: 100})
    }
    editPopUp = () => {
        this.state.popup_visible = true
    }
    closePopUp = () => {
        this.state.popup_visible = false
        console.log(this.state.popup_visible)
    }

    selectProductSearchBar = async (part) => {
        console.log(part)
        await this.getData([part])
    }

    backButtonClick() {
        core.bus.off('barcode_scanned', this, this.scan1);
        this.trigger("back_button_product_details", {
            click: "hi i am clicked",
        });
    }

    imageUrl(id, write_date) {
        return `/web/image?model=product.product&field=image_512&id=${id}&write_date=${write_date}&unique=1`;
    }


    getData = async (scanned_part) => {
        console.time('getdata')
        console.log(scanned_part)
        let data = await this.rpcService(`/web/dataset/call_kw/product.product/get_product_info`, {
            model: 'product.product',
            method: 'get_product_info',
            args: [[scanned_part[0].id], 1],
            kwargs: {}
            //context: {},
        });
        console.log(data)
        let product_data = {
            product_details: [data.product_data],
            warehouses: data.warehouses,
            warehouse_list_without_zero_stock: data.warehouse_list_without_zero_stock,
            suppliers: data.suppliers,
            variants: data.variants,
            price_lists: data.price_list,
            user_id: data.user_id,
            company_id: data.company_id,
            currency_data: data.currency_data,
        }
        this.state.part = product_data
        this.state.part_available = true
        console.timeEnd('getdata')
    }
}

export class SearchBar extends Component {
    setup() {

        this.state = useState({is_visible: false, parts: []})
        this.query = useState({value: ''})
        this.orm = useService("orm");
        useExternalListener(window, "click", this.onWindowClicked);
        this.ui = useService("ui");
        useEffect(
            () => {
                Promise.resolve().then(() => {
                    this.myActiveEl = this.ui.activeElement;
                });
            },
            () => []
        );
        useEffect(
            () => {
                console.log('useeffect_query')
                this.sendRequest(this.query.value)
            },
            () => [this.query.value]
        );
    }


    setQuery = async (e) => {

        clearTimeout(this.time_out)
        this.time_out = setTimeout(() => {
            this.query.value = e.target.value
        }, 300);
    }
    sendRequest = async (value) => {
        console.log('send request')
        let parts = await this.orm.searchRead("product.product", ["|", ["name", "ilike", value], ["default_code", "ilike", value]], ["id", "detailed_type", "display_name", "name", "default_code", "categ_id", "weight", "list_price", "write_date"], {limit: 30})
        this.state.parts = parts
    }


    imageUrl(id, write_date) {
        return `/web/image?model=product.product&field=image_128&id=${id}&write_date=${write_date}&unique=1`;
    }

    onFocus() {
        this.state.is_visible = true
    }

    selectProduct = async (part) => {
        this.state.is_visible = false
        await this.props.selectedProductFunction(part)
    }

    onWindowClicked(ev) {
        // Return if already closed
        if (!this.state.is_visible) {
            return;
        }
        // Return if it's a different ui active element
        if (this.ui.activeElement !== this.myActiveEl) {
            return;
        }
        // Close if we clicked outside the dropdown, or outside the parent
        // element if it is the toggler
        const rootEl = this.el;
        const gotClickedInside = rootEl.contains(ev.target);
        if (!gotClickedInside) {
            console.log("if condition satis")
            this.state.is_visible = false
        }
        console.log("window clicked")
        console.log(this.state.is_visible)
    }
}

export class SearchBar1 extends Component {
    setup() {

        this.state = useState({is_visible: true, parts: []})
        this.query = useState({value: ''})
        this.orm = useService("orm");
        useEffect(
            () => {
                console.log('useeffect_query')
                this.sendRequest(this.query.value)
            },
            () => [this.query.value]
        );
    }


    setQuery = async (e) => {

        clearTimeout(this.time_out)
        this.time_out = setTimeout(() => {
            this.query.value = e.target.value
        }, 300);
    }
    sendRequest = async (value) => {
        console.log('send request')
        let parts = await this.orm.searchRead("product.product", ["|", ["name", "ilike", value], ["default_code", "ilike", value]], ["id", "detailed_type", "display_name", "name", "default_code", "categ_id", "weight", "list_price", "write_date"], {limit: 30})
        this.state.parts = parts
    }

    imageUrl(id, write_date) {
        return `/web/image?model=product.product&field=image_128&id=${id}&write_date=${write_date}&unique=1`;
    }

    onFocus() {
        // this.state.is_visible = true
    }

    selectProduct = async (part) => {
        this.state.is_visible = false
        await this.props.selectedProductFunction(part)
    }

}

export class WarehouseDetailsTable extends Component {
    setup() {
        this.state = useState({is_expanded: false, is_hide_no_stock: false})
    }

    selectExpandAll = (e) => {
        let change_state = e.target.checked ? this.state.is_expanded = true : this.state.is_expanded = false
        console.log(e.target.checked)
        console.log(this.state.is_expanded)
    }
    selectHideNoStock = (e) => {
        let change_state = e.target.checked ? this.state.is_hide_no_stock = true : this.state.is_hide_no_stock = false
    }

}

export class CollapsableRow extends Component {
    setup() {
        this.state = useState({is_visible: this.props.is_expanded})
    }

    async willUpdateProps(nextProps) {
        this.state.is_visible = nextProps.is_expanded
    }

    clickExpand = () => {
        let change_state = this.state.is_visible ? this.state.is_visible = false : this.state.is_visible = true
    }

}


ProductDetails.template = "product_get_info.ProductDetails"
ProductDetails.components = {SearchBar, WarehouseDetailsTable, SearchBar1};
WarehouseDetailsTable.components = {CollapsableRow}
WarehouseDetailsTable.template = "product_get_info.WarehouseDetailsTable"
SearchBar.template = "product_get_info.SearchBar"
SearchBar1.template = "product_get_info.SearchBar1"
CollapsableRow.template = "product_get_info.CollapsableRow"
core.action_registry.add('product_info_app', ProductDetails);