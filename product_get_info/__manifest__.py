{
    'name' : 'Product Information Viewer',
    'version' : '15.0.0.0',
    'summary': 'Tools',
    'sequence': 15,
    'description': "All in one product information viewer with searching op",
    'category': 'Productivity',
    'website': 'https://www.odoo.com/page/billing',
    'images' : [],
    'author': 'BrowseInfo',
    "depends": ["web","sale", "sale_management","purchase","stock","barcodes"],
    "data":[
                "views/views.xml",

             ],
    'assets': {
        'web.assets_qweb': [

            "/product_get_info/static/src/js/product_info_components/ProductDetails.xml",

        ],
        "web.assets_backend": [
            "/product_get_info/static/src/fonts/fonts.css",
            "/product_get_info/static/src/js/product_info_components/ProductDetails.css",
            "/product_get_info/static/src/js/product_info_components/ProductDetails.js",
            ],
    },
    'demo': [],
    'qweb': [],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'OPL-1',
    'live_test_url':'https://youtu.be/_aihFWW4a5E',
    'price':30.00,
    'support':'niroshlakshan2@gmail.com',
    'currency':'USD'


}
