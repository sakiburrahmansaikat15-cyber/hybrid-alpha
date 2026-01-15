import React from 'react';
import ConfigHubPage from '../../../components/ConfigHubPage';
import { CreditCard, Percent, FileText, Monitor } from 'lucide-react';

const PosConfig = () => {
    const items = [
        {
            title: 'Payment Methods',
            path: '/Payment-Methods',
            description: 'Setup and verify gateway integrations for Cash, Card, and Digital wallets.',
            icon: CreditCard
        },
        {
            title: 'Tax Rates',
            path: '/tax-rates',
            description: 'Configure regional tax percentages and automated calculation rules.',
            icon: Percent
        },
        {
            title: 'Receipt Templates',
            path: '/receipt-templates',
            description: 'Design the visual layout and print settings for customer receipts.',
            icon: FileText
        }
    ];

    return (
        <ConfigHubPage
            title="POS Config"
            description="Refine your terminal transactions, fiscal compliance, and customer touchpoints."
            icon={Monitor}
            items={items}
            colorClass="bg-orange-500"
        />
    );
};

export default PosConfig;
