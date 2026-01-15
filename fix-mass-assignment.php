<?php

/**
 * Mass Assignment Security Fix Script
 * This script fixes all models with $guarded = [] vulnerability
 */

$modelsToFix = [
    // POS Models
    'app/Models/POS/CustomerAddress.php' => [
        'customer_id',
        'address_type',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'zip_code',
        'country',
        'is_default'
    ],
    'app/Models/POS/CustomerGroup.php' => [
        'name',
        'description',
        'discount_percentage',
        'status'
    ],
    'app/Models/POS/GiftCard.php' => [
        'code',
        'balance',
        'initial_balance',
        'customer_id',
        'expiry_date',
        'status'
    ],
    'app/Models/POS/HoldCart.php' => [
        'terminal_id',
        'customer_id',
        'cart_data',
        'notes',
        'status'
    ],
    'app/Models/POS/PaymentGateway.php' => [
        'name',
        'gateway_type',
        'api_key',
        'api_secret',
        'is_active',
        'config'
    ],
    'app/Models/POS/PaymentMethod.php' => [
        'name',
        'code',
        'description',
        'is_active'
    ],
    'app/Models/POS/PosSession.php' => [
        'terminal_id',
        'user_id',
        'opening_balance',
        'closing_balance',
        'opened_at',
        'closed_at',
        'status',
        'notes'
    ],
    'app/Models/POS/PosTerminal.php' => [
        'name',
        'code',
        'location',
        'is_active',
        'receipt_template_id'
    ],
    'app/Models/POS/Receipt.php' => [
        'sale_id',
        'receipt_number',
        'template_id',
        'printed_at'
    ],
    'app/Models/POS/ReceiptTemplate.php' => [
        'name',
        'header',
        'footer',
        'logo',
        'is_default'
    ],
    'app/Models/POS/SaleDiscount.php' => [
        'sale_id',
        'discount_type',
        'discount_value',
        'discount_amount',
        'reason'
    ],
    'app/Models/POS/SaleItem.php' => [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total'
    ],
    'app/Models/POS/SalePayment.php' => [
        'sale_id',
        'payment_method_id',
        'amount',
        'reference_number',
        'notes'
    ],
    'app/Models/POS/SaleTax.php' => [
        'sale_id',
        'tax_rate_id',
        'tax_amount',
        'taxable_amount'
    ],
    'app/Models/POS/TaxGroup.php' => [
        'name',
        'description',
        'is_active'
    ],
    'app/Models/POS/TaxRate.php' => [
        'name',
        'rate',
        'tax_group_id',
        'is_compound',
        'is_active'
    ],
    'app/Models/POS/Voucher.php' => [
        'code',
        'discount_type',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'start_date',
        'end_date',
        'usage_limit',
        'used_count',
        'is_active'
    ],

    // HRM Models
    'app/Models/HRM/Attendance.php' => [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'shift_id',
        'status',
        'notes',
        'overtime_hours'
    ],
    'app/Models/HRM/Department.php' => [
        'name',
        'description',
        'manager_id',
        'status'
    ],
    'app/Models/HRM/Designation.php' => [
        'name',
        'description',
        'department_id',
        'status'
    ],
    'app/Models/HRM/EmployeeDocument.php' => [
        'employee_id',
        'document_type',
        'document_name',
        'file_path',
        'expiry_date',
        'notes'
    ],
    'app/Models/HRM/LeaveApplication.php' => [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'days',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'notes'
    ],
    'app/Models/HRM/LeaveType.php' => [
        'name',
        'days_per_year',
        'is_paid',
        'description',
        'status'
    ],
    'app/Models/HRM/Payroll.php' => [
        'employee_id',
        'salary_id',
        'pay_period_start',
        'pay_period_end',
        'gross_salary',
        'deductions',
        'net_salary',
        'payment_date',
        'payment_method',
        'status',
        'notes'
    ],
    'app/Models/HRM/Salary.php' => [
        'employee_id',
        'basic_salary',
        'allowances',
        'deductions',
        'effective_from',
        'status'
    ],
    'app/Models/HRM/Shift.php' => [
        'name',
        'start_time',
        'end_time',
        'break_duration',
        'status'
    ],

    // CRM Models
    'app/Models/CRM/Activity.php' => [
        'subject',
        'activity_type',
        'description',
        'activity_date',
        'duration',
        'lead_id',
        'opportunity_id',
        'customer_id',
        'assigned_to',
        'status',
        'priority'
    ],
    'app/Models/CRM/Campaign.php' => [
        'name',
        'campaign_type',
        'start_date',
        'end_date',
        'budget',
        'expected_revenue',
        'actual_cost',
        'description',
        'status'
    ],
    'app/Models/CRM/Company.php' => [
        'name',
        'industry',
        'website',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'notes',
        'status'
    ],
    'app/Models/CRM/Contact.php' => [
        'first_name',
        'last_name',
        'email',
        'phone',
        'mobile',
        'company_id',
        'job_title',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'notes',
        'status'
    ],
    'app/Models/CRM/Customer.php' => [
        'name',
        'email',
        'phone',
        'company_id',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'customer_type',
        'notes',
        'status'
    ],
    'app/Models/CRM/Lead.php' => [
        'first_name',
        'last_name',
        'email',
        'phone',
        'company',
        'lead_source_id',
        'lead_status_id',
        'assigned_to',
        'estimated_value',
        'notes',
        'status'
    ],
    'app/Models/CRM/LeadSource.php' => [
        'name',
        'description',
        'status'
    ],
    'app/Models/CRM/LeadStatus.php' => [
        'name',
        'color',
        'order',
        'is_default',
        'description'
    ],
    'app/Models/CRM/Opportunity.php' => [
        'name',
        'customer_id',
        'opportunity_stage_id',
        'amount',
        'probability',
        'expected_close_date',
        'assigned_to',
        'description',
        'status'
    ],
    'app/Models/CRM/OpportunityStage.php' => [
        'name',
        'probability',
        'order',
        'is_closed',
        'is_won',
        'description'
    ],
    'app/Models/CRM/Ticket.php' => [
        'ticket_number',
        'subject',
        'description',
        'customer_id',
        'assigned_to',
        'priority',
        'status',
        'category',
        'resolved_at'
    ],

    // Other Models
    'app/Models/Transaction.php' => [
        'transaction_type',
        'amount',
        'payment_type_id',
        'reference_number',
        'description',
        'transaction_date',
        'status'
    ],
    'app/Models/SerialList.php' => [
        'serial_number',
        'product_id',
        'stock_id',
        'status'
    ],
    'app/Models/Variants.php' => [
        'product_id',
        'variant_name',
        'sku',
        'price',
        'stock_quantity',
        'status'
    ],
    'app/Models/Role.php' => [
        'name',
        'permissions',
        'description'
    ],
    'app/Models/Stocks.php' => [
        'product_id',
        'warehouse_id',
        'vendor_id',
        'quantity',
        'unit_price',
        'total_price',
        'payment_type_id',
        'stock_date',
        'expiry_date',
        'batch_number',
        'notes',
        'status'
    ],
];

echo "Mass Assignment Security Fix Script\n";
echo "===================================\n\n";

$fixed = 0;
$errors = 0;

foreach ($modelsToFix as $modelPath => $fillableFields) {
    $fullPath = __DIR__ . '/' . $modelPath;

    if (!file_exists($fullPath)) {
        echo "⚠️  SKIP: $modelPath (file not found)\n";
        continue;
    }

    $content = file_get_contents($fullPath);

    // Check if already has $fillable
    if (strpos($content, 'protected $fillable') !== false) {
        echo "✓  SKIP: $modelPath (already has \$fillable)\n";
        continue;
    }

    // Build the fillable array string
    $fillableString = "protected \$fillable = [\n";
    foreach ($fillableFields as $field) {
        $fillableString .= "        '$field',\n";
    }
    $fillableString .= "    ];";

    // Replace $guarded with $fillable
    $patterns = [
        '/protected \$guarded = \[\];/',
        '/protected \$guarded = \[\'id\'\];/',
    ];

    $replaced = false;
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $content)) {
            $content = preg_replace($pattern, $fillableString, $content);
            $replaced = true;
            break;
        }
    }

    if ($replaced) {
        file_put_contents($fullPath, $content);
        echo "✅ FIXED: $modelPath\n";
        $fixed++;
    } else {
        echo "❌ ERROR: $modelPath (pattern not found)\n";
        $errors++;
    }
}

echo "\n===================================\n";
echo "Summary:\n";
echo "✅ Fixed: $fixed models\n";
echo "❌ Errors: $errors models\n";
echo "===================================\n";
