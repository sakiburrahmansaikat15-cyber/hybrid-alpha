import React from 'react';
import ConfigHubPage from '../../../components/ConfigHubPage';
import { Building, Clock, FileMinus, Briefcase } from 'lucide-react';

const HrConfig = () => {
    const items = [
        {
            title: 'Designations',
            path: '/designations',
            description: 'Define organizational hierarchy and internal job titles.',
            icon: Building
        },
        {
            title: 'Shifts',
            path: '/shifts',
            description: 'Manage work hours, grace periods, and rotational duty schedules.',
            icon: Clock
        },
        {
            title: 'Leave Types',
            path: '/leave_types',
            description: 'Configure annual, sick, and specialized leave policy categories.',
            icon: FileMinus
        }
    ];

    return (
        <ConfigHubPage
            title="HR Config"
            description="Orchestrate your workforce structural models and operational timeframes."
            icon={Briefcase}
            items={items}
            colorClass="bg-fuchsia-500"
        />
    );
};

export default HrConfig;
