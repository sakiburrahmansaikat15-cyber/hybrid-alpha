/**
 * POS Component Generator Script
 * This script generates all remaining POS components with:
 * - Bug fixes (notification cleanup, useCallback dependencies)
 * - Compact modern design
 * - Consistent UX patterns
 */

const components = [
    {
        name: 'GiftCards',
        api: '/api/pos/gift-cards',
        title: 'Gift Cards',
        description: 'Manage gift card inventory',
        color: 'purple',
        icon: 'Gift',
        fields: ['code', 'balance', 'expiry_date', 'status']
    },
    {
        name: 'Vouchers',
        api: '/api/pos/vouchers',
        title: 'Vouchers',
        description: 'Manage discount vouchers',
        color: 'green',
        icon: 'Ticket',
        fields: ['code', 'discount_rate', 'expiry_date', 'status']
    },
    {
        name: 'HoldCarts',
        api: '/api/pos/hold-carts',
        title: 'Hold Carts',
        description: 'Manage suspended carts',
        color: 'amber',
        icon: 'ShoppingCart',
        fields: ['terminal_id', 'cart_data']
    },
    {
        name: 'PosTerminals',
        api: '/api/pos/terminals',
        title: 'POS Terminals',
        description: 'Manage terminal devices',
        color: 'cyan',
        icon: 'Monitor',
        fields: ['name', 'location', 'status']
    },
    {
        name: 'PosSessions',
        api: '/api/pos/sessions',
        title: 'POS Sessions',
        description: 'Manage terminal sessions',
        color: 'indigo',
        icon: 'Clock',
        fields: ['terminal_id', 'opened_at', 'opening_cash', 'closed_at', 'closing_cash']
    },
    {
        name: 'Receipts',
        api: '/api/pos/receipts',
        title: 'Receipts',
        description: 'Manage receipt records',
        color: 'teal',
        icon: 'Receipt',
        fields: ['sale_id', 'receipt_no', 'sent_via']
    },
    {
        name: 'ReceiptTemplates',
        api: '/api/pos/receipt-templates',
        title: 'Receipt Templates',
        description: 'Manage receipt layouts',
        color: 'violet',
        icon: 'FileText',
        fields: ['name', 'layout']
    },
    {
        name: 'CustomerGroups',
        api: '/api/pos/customer-groups',
        title: 'Customer Groups',
        description: 'Manage customer segments',
        color: 'blue',
        icon: 'Users',
        fields: ['name', 'pricing_type', 'discount_rate']
    },
    {
        name: 'CustomerAddresses',
        api: '/api/pos/customer-addresses',
        title: 'Customer Addresses',
        description: 'Manage delivery addresses',
        color: 'rose',
        icon: 'MapPin',
        fields: ['customer_id', 'address', 'city', 'country']
    },
    {
        name: 'PaymentGateways',
        api: '/api/pos/payment-gateways',
        title: 'Payment Gateways',
        description: 'Manage payment integrations',
        color: 'cyan',
        icon: 'CreditCard',
        fields: ['name', 'config', 'status']
    }
];


// Template ready for component generation logic injection.
