from odoo import api, fields, models, _
from odoo.exceptions import UserError
from itertools import groupby
from operator import itemgetter
from datetime import date


class ProductProductBarcodeApp(models.Model):
    _inherit = 'product.product'

    def get_detailed_type_name(self):
        name = ''
        if self.detailed_type == 'product':
            name = "Storable Product"
        elif self.detailed_type == 'consu':
            name = "Consumable"
        elif self.detailed_type == 'service':
            name = "Service"
        return name

    def get_product_info(self, quantity):
        self.ensure_one()

        user_id = self.env.user.id
        company_id = self.env.company.id
        currency_id = self.env.company.currency_id
        currency_data = {'symbol': currency_id.symbol, 'name': currency_id.name, 'position': currency_id.position}
        pricelists = self.env['product.pricelist'].search([])
        price_per_pricelist_id = pricelists.price_get(self.id, quantity)
        pricelist_list = [{'name': pl.name, 'price': price_per_pricelist_id[pl.id],
                           'currency_data': {'name': pl.currency_id.name, 'symbol': pl.currency_id.symbol,
                                             'position': pl.currency_id.position}} for pl in pricelists]

        product_data = {
            "id": self.id,
            "detailed_type": self.get_detailed_type_name(),
            "display_name": self.display_name if self.display_name else '-',
            "name": self.name,
            "default_code": self.default_code if self.default_code else '-',
            "categ_id": self.categ_id.display_name,
            "weight": self.weight,
            "list_price": self.list_price,
            "standard_price": self.standard_price,
            "write_date": self.write_date,
            "qty_available": self.qty_available,
            "virtual_available": self.virtual_available,
            "barcode": self.barcode if self.barcode else '-',
            "description_sale": self.description_sale if self.description_sale else '-',
            "uom_id": self.uom_id.display_name,
            "uom_po_id": self.uom_po_id.display_name,
            "volume": self.volume,
            "sale_delay": self.sale_delay,
            "volume_uom_name": self.volume_uom_name,
            "weight_uom_name": self.weight_uom_name,
        }
        warehouse_list = [
            {'name': w.name,
             'id': w.id,
             'stock_location': w.lot_stock_id.display_name,
             'child_locations': [
                 {'location': location.display_name,
                  'available_quantity': self.with_context({'location': location.id}).qty_available,
                  'forecasted_quantity': self.with_context({'location': location.id}).virtual_available}

                 for location in w.lot_stock_id.child_internal_location_ids],
             'available_quantity': self.with_context({'warehouse': w.id}).qty_available,
             'forecasted_quantity': self.with_context({'warehouse': w.id}).virtual_available,
             'uom': self.uom_name}
            for w in self.env['stock.warehouse'].search([])]

        # Warehouses
        warehouse_list_without_zero_stock = [
            {'name': w.name,
             'id': w.id,
             'stock_location': w.lot_stock_id.display_name,
             'child_locations': [
                 {'location': location.display_name,
                  'available_quantity': self.with_context({'location': location.id}).qty_available,
                  'forecasted_quantity': self.with_context({'location': location.id}).virtual_available}

                 for location in w.lot_stock_id.child_internal_location_ids if
                 self.with_context({'location': location.id}).qty_available != 0],
             'available_quantity': self.with_context({'warehouse': w.id}).qty_available,
             'forecasted_quantity': self.with_context({'warehouse': w.id}).virtual_available,
             'uom': self.uom_name}
            for w in self.env['stock.warehouse'].search([])]

        # Suppliers
        key = itemgetter('name')
        supplier_list = []
        for key, group in groupby(sorted(self.seller_ids, key=key), key=key):
            for s in list(group):
                if not ((s.date_start and s.date_start > date.today()) or (
                        s.date_end and s.date_end < date.today()) or (s.min_qty > quantity)):
                    supplier_list.append({
                        'name': s.name.name,
                        'delay': s.delay,
                        'price': s.price,
                        'currency_data': {'name': s.currency_id.name, 'symbol': s.currency_id.symbol,
                                          'position': s.currency_id.position}
                    })
                    break

        # Variants
        variant_list = [{'name': attribute_line.attribute_id.name,
                         'values': list(
                             map(lambda attr_name: {'name': attr_name, 'search': '%s %s' % (self.name, attr_name)},
                                 attribute_line.value_ids.mapped('name')))}
                        for attribute_line in self.attribute_line_ids]

        return {
            # 'all_prices': all_prices,
            'product_data': product_data,
            'warehouses': warehouse_list,
            'warehouse_list_without_zero_stock': warehouse_list_without_zero_stock,
            'suppliers': supplier_list,
            'variants': variant_list,
            'price_list': pricelist_list,
            'user_id': user_id,
            'company_id': company_id,
            'currency_data': currency_data,
        }
