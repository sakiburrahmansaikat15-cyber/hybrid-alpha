import React from 'react';
import ConfigHubPage from '../../../components/ConfigHubPage';
import { Globe, Activity, Target, Users } from 'lucide-react';

const CrmConfig = () => {
    const items = [
        {
            title: 'Lead Sources',
            path: '/lead-source',
            description: 'Track the origin of your potential customers (Web, Social, Referral).',
            icon: Globe
        },
        {
            title: 'Lead Statuses',
            path: '/lead-status',
            description: 'Define the lifecycle stages of your leads from Prospect to Closed.',
            icon: Activity
        },
        {
            title: 'Pipelines',
            path: '/opportunity-stage',
            description: 'Configure multi-stage deal pipelines for sales optimization.',
            icon: Target
        }
    ];

    return (
        <ConfigHubPage
            title="CRM Config"
            description="Optimize your customer relationship pathways and lead management protocols."
            icon={Users}
            items={items}
            colorClass="bg-cyan-500"
        />
    );
};

export default CrmConfig;
