import React from 'react';
import ConfigHubPage from '../../../components/ConfigHubPage';
import { Ruler, Layers, Box, Package } from 'lucide-react';

const InventoryConfig = () => {
    const items = [
        {
            title: 'Units',
            path: '/units',
            description: 'Define measurement systems for your products (e.g. KG, PCS, Boxes).',
            icon: Ruler
        },
        {
            title: 'Product Types',
            path: '/ProductType',
            description: 'Categorize products into logical groups like Physical, Service, or Digital.',
            icon: Layers
        },
        {
            title: 'Variants',
            path: '/Variants',
            description: 'Manage attributes like Size, Color, or Material for stock items.',
            icon: Box
        }
    ];

    return (
        <ConfigHubPage
            title="Inventory Config"
            description="Initialize and manage the core parameters of your warehouse and product lifecycle systems."
            icon={Package}
            items={items}
            colorClass="bg-blue-500"
        />
    );
};

export default InventoryConfig;
