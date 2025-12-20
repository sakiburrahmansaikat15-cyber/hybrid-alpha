<?php

use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoriesController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\Api\TransactionsController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductTypeController;
use App\Http\Controllers\Api\SerialListController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\SubItemController;
use App\Http\Controllers\Api\VariantController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\WarehouseController;



    // HRM

use App\Http\Controllers\HRM\DepartmentsController;
use App\Http\Controllers\HRM\DesignationController;
use App\Http\Controllers\HRM\EmployeeController;
use App\Http\Controllers\HRM\EmployeeDocumentController;
use App\Http\Controllers\HRM\AttendenceController;
use App\Http\Controllers\HRM\ShiftController;
use App\Http\Controllers\HRM\LeaveTypesController;
use App\Http\Controllers\HRM\LeaveApplicationController;
use App\Http\Controllers\HRM\SalariesController;
use App\Http\Controllers\HRM\PayRollController;






        // CRM


use App\Http\Controllers\CRM\LeadController;
use App\Http\Controllers\CRM\LeadSourceController;
use App\Http\Controllers\CRM\LeadStatusController;
use App\Http\Controllers\CRM\CustomerController;
use App\Http\Controllers\CRM\CompanyController;
use App\Http\Controllers\CRM\ContactController;
use App\Http\Controllers\CRM\OpportunityController;
use App\Http\Controllers\CRM\OpportunityStageController;
use App\Http\Controllers\CRM\ActivityController;
use App\Http\Controllers\CRM\CampaignController;
use App\Http\Controllers\CRM\TicketController;


    //   POS

use App\Http\Controllers\POS\TaxGroupController;
use App\Http\Controllers\POS\TaxRateController;
use App\Http\Controllers\POS\ReceiptTemplateController;
use App\Http\Controllers\POS\PaymentGatewayController;
use App\Http\Controllers\POS\PaymentMethodController;
use App\Http\Controllers\POS\VoucherController;
use App\Http\Controllers\POS\GiftCardController;
use App\Http\Controllers\POS\CustomerGroupController;
use App\Http\Controllers\POS\CustomersController;
use App\Http\Controllers\POS\CustomerAddressController;
use App\Http\Controllers\POS\PosTerminalController;
use App\Http\Controllers\POS\SaleController;
use App\Http\Controllers\POS\SaleDiscountController;
use App\Http\Controllers\POS\SalePaymentController;
use App\Http\Controllers\POS\HoldCartController;
use App\Http\Controllers\POS\SaleTaxController;
use App\Http\Controllers\POS\SaleItemController;
use App\Http\Controllers\POS\PosSessionController;
use App\Http\Controllers\POS\ReceiptsController;





Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::post('/', [RoleController::class, 'store']);
    Route::get('/{id}', [RoleController::class, 'show']);
    Route::post('/{id}', [RoleController::class, 'update']);
    Route::delete('/{id}', [RoleController::class, 'destroy']);
});


Route::prefix('units')->group(function () {
    Route::get('/', [UnitController::class, 'index']);
    Route::post('/', [UnitController::class, 'store']);
    Route::get('/{id}', [UnitController::class, 'show']);
    Route::post('/{id}', [UnitController::class, 'update']);
    Route::delete('/{id}', [UnitController::class, 'destroy']);
});


Route::prefix('categories')->group(function () {
    Route::get('/', [CategoriesController::class, 'index']);
    Route::post('/', [CategoriesController::class, 'store']);
    Route::get('/{id}', [CategoriesController::class, 'show']);
    Route::post('/{id}', [CategoriesController::class, 'update']);
    Route::delete('/{id}', [CategoriesController::class, 'destroy']);
});




Route::prefix('sub-categories')->group(function () {
    Route::get('/', [SubCategoryController::class, 'index']);
    Route::post('/', [SubCategoryController::class, 'store']);
    Route::get('/{id}', [SubCategoryController::class, 'show']);
    Route::post('/{id}', [SubCategoryController::class, 'update']);
    Route::delete('/{id}', [SubCategoryController::class, 'destroy']);
});




Route::prefix('sub-items')->group(function () {
    Route::get('/', [SubItemController::class, 'index']);
    Route::post('/', [SubItemController::class, 'store']);
    Route::get('/{id}', [SubItemController::class, 'show']);
    Route::post('/{id}', [SubItemController::class, 'update']);
    Route::delete('/{id}', [SubItemController::class, 'destroy']);
});





Route::prefix('brands')->group(function () {
    Route::get('/', [BrandController::class, 'index']);
    Route::post('/', [BrandController::class, 'store']);
    Route::get('/{id}', [BrandController::class, 'show']);
    Route::post('/{id}', [BrandController::class, 'update']);
    Route::delete('/{id}', [BrandController::class, 'destroy']);
});


Route::prefix('product-type')->group(function () {
    Route::get('/', [ProductTypeController::class, 'index']);
    Route::post('/', [ProductTypeController::class, 'store']);
    Route::get('/{id}', [ProductTypeController::class, 'show']);
    Route::post('/{id}', [ProductTypeController::class, 'update']);
    Route::delete('/{id}', [ProductTypeController::class, 'destroy']);
});



Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::post('/', [ProductController::class, 'store']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::post('/{id}', [ProductController::class, 'update']);
    Route::delete('/{id}', [ProductController::class, 'destroy']);
});



Route::prefix('variants')->group(function () {
    Route::get('/', [VariantController::class, 'index']);
    Route::post('/', [VariantController::class, 'store']);
    Route::get('/{id}', [VariantController::class, 'show']);
    Route::post('/{id}', [VariantController::class, 'update']);
    Route::delete('/{id}', [VariantController::class, 'destroy']);
});




Route::prefix('vendors')->group(function () {
    Route::get('/', [VendorController::class, 'index']);
    Route::post('/', [VendorController::class, 'store']);
    Route::get('/{id}', [VendorController::class, 'show']);
    Route::post('/{id}', [VendorController::class, 'update']);
    Route::delete('/{id}', [VendorController::class, 'destroy']);
});



Route::prefix('payment-types')->group(function () {
    Route::get('/', [PaymentTypeController::class, 'index']);
    Route::post('/', [PaymentTypeController::class, 'store']);
    Route::get('/{id}', [PaymentTypeController::class, 'show']);
    Route::post('/{id}', [PaymentTypeController::class, 'update']);
    Route::delete('/{id}', [PaymentTypeController::class, 'destroy']);
});



Route::prefix('warehouses')->group(function () {
    Route::get('/', [WarehouseController::class, 'index']);
    Route::post('/', [WarehouseController::class, 'store']);
    Route::get('{id}', [WarehouseController::class, 'show']);
    Route::put('{id}', [WarehouseController::class, 'update']);
    Route::delete('{id}', [WarehouseController::class, 'destroy']);
});



Route::prefix('stocks')->group(function () {
    Route::get('/', [StockController::class, 'index']);
    Route::post('/', [StockController::class, 'store']);
    Route::get('/{id}', [StockController::class, 'show']);
    Route::post('/{id}', [StockController::class, 'update']);
    Route::delete('/{id}', [StockController::class, 'destroy']);
});



Route::prefix('serial-list')->group(function () {
    Route::get('/', [SerialListController::class, 'index']);
    Route::post('/', [SerialListController::class, 'store']);
    Route::get('/{id}', [SerialListController::class, 'show']);
    Route::post('/{id}', [SerialListController::class, 'update']);
    Route::delete('/{id}', [SerialListController::class, 'destroy']);
});




Route::prefix('transaction')->group(function () {
    Route::get('/', [TransactionsController::class, 'index']);
    Route::post('/', [TransactionsController::class, 'store']);
    Route::get('/{id}', [TransactionsController::class, 'show']);
    Route::post('/{id}', [TransactionsController::class, 'update']);
    Route::delete('/{id}', [TransactionsController::class, 'destroy']);
});




Route::prefix('hrm')->group(function () {

    Route::prefix('attendances')->group(function () {
        Route::get('/', [AttendenceController::class, 'index']);
        Route::post('/', [AttendenceController::class, 'store']);
        Route::get('/{id}', [AttendenceController::class, 'show']);
        Route::post('/{id}', [AttendenceController::class, 'update']);
        Route::delete('/{id}', [AttendenceController::class, 'destroy']);
    });


    Route::prefix('employee-documents')->group(function () {
    Route::get('/', [EmployeeDocumentController::class, 'index']);
    Route::post('/', [EmployeeDocumentController::class, 'store']);
    Route::get('/{id}', [EmployeeDocumentController::class, 'show']);
    Route::post('/{id}', [EmployeeDocumentController::class, 'update']);
    Route::delete('/{id}', [EmployeeDocumentController::class, 'destroy']);
});


Route::prefix('departments')->group(function () {
    Route::get('/', [DepartmentsController::class, 'index']);
    Route::post('/', [DepartmentsController::class, 'store']);
    Route::get('/{id}', [DepartmentsController::class, 'show']);
    Route::post('/{id}', [DepartmentsController::class, 'update']);
    Route::delete('/{id}', [DepartmentsController::class, 'destroy']);
});




Route::prefix('designations')->group(function () {
    Route::get('/', [DesignationController::class, 'index']);
    Route::post('/', [DesignationController::class, 'store']);
    Route::get('/{id}', [DesignationController::class, 'show']);
    Route::post('/{id}', [DesignationController::class, 'update']);
    Route::delete('/{id}', [DesignationController::class, 'destroy']);
});




Route::prefix('employees')->group(function () {
    Route::get('/', [EmployeeController::class, 'index']);
    Route::post('/', [EmployeeController::class, 'store']);
    Route::get('/{id}', [EmployeeController::class, 'show']);
    Route::post('/{id}', [EmployeeController::class, 'update']);
    Route::delete('/{id}', [EmployeeController::class, 'destroy']);
});


Route::prefix('shifts')->group(function () {
    Route::get('/', [ShiftController::class, 'index']);
    Route::post('/', [ShiftController::class, 'store']);
    Route::get('/{id}', [ShiftController::class, 'show']);
    Route::post('/{id}', [ShiftController::class, 'update']);
    Route::delete('/{id}', [ShiftController::class, 'destroy']);
});


Route::prefix('leave-types')->group(function () {
    Route::get('/', [LeaveTypesController::class, 'index']);
    Route::post('/', [LeaveTypesController::class, 'store']);
    Route::get('/{id}', [LeaveTypesController::class, 'show']);
    Route::post('/{id}', [LeaveTypesController::class, 'update']);
    Route::delete('/{id}', [LeaveTypesController::class, 'destroy']);
});



Route::prefix('leave-applications')->group(function () {
    Route::get('/', [LeaveApplicationController::class, 'index']);
    Route::post('/', [LeaveApplicationController::class, 'store']);
    Route::get('/{id}', [LeaveApplicationController::class, 'show']);
    Route::post('/{id}', [LeaveApplicationController::class, 'update']);
    Route::delete('/{id}', [LeaveApplicationController::class, 'destroy']);
});



Route::prefix('salaries')->group(function () {
    Route::get('/', [SalariesController::class, 'index']);
    Route::post('/', [SalariesController::class, 'store']);
    Route::get('/{id}', [SalariesController::class, 'show']);
    Route::post('/{id}', [SalariesController::class, 'update']);
    Route::delete('/{id}', [SalariesController::class, 'destroy']);
});


Route::prefix('payroll')->group(function () {
    Route::get('/', [PayRollController::class, 'index']);
    Route::post('/', [PayRollController::class, 'store']);
    Route::get('/{id}', [PayRollController::class, 'show']);
    Route::post('/{id}', [PayRollController::class, 'update']);
    Route::delete('/{id}', [PayRollController::class, 'destroy']);
});

});





Route::prefix('crm')->group(function () {

    Route::prefix('leads')->group(function () {
        Route::get('/', [LeadController::class, 'index']);
        Route::post('/', [LeadController::class, 'store']);
        Route::get('/{id}', [LeadController::class, 'show']);
        Route::post('/{id}', [LeadController::class, 'update']);
        Route::delete('/{id}', [LeadController::class, 'destroy']);
    });


        Route::prefix('lead-sources')->group(function () {
        Route::get('/', [LeadSourceController::class, 'index']);
        Route::post('/', [LeadSourceController::class, 'store']);
        Route::get('/{id}', [LeadSourceController::class, 'show']);
        Route::post('/{id}', [LeadSourceController::class, 'update']);
        Route::delete('/{id}', [LeadSourceController::class, 'destroy']);
    });


     Route::prefix('lead-statuses')->group(function () {
        Route::get('/', [LeadStatusController::class, 'index']);
        Route::post('/', [LeadStatusController::class, 'store']);
        Route::get('/{id}', [LeadStatusController::class, 'show']);
        Route::post('/{id}', [LeadStatusController::class, 'update']);
        Route::delete('/{id}', [LeadStatusController::class, 'destroy']);
    });



    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::post('/{id}', [CustomerController::class, 'update']);
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
    });

       Route::prefix('companies')->group(function () {
        Route::get('/', [CompanyController::class, 'index']);
        Route::post('/', [CompanyController::class, 'store']);
        Route::get('/{id}', [CompanyController::class, 'show']);
        Route::post('/{id}', [CompanyController::class, 'update']);
        Route::delete('/{id}', [CompanyController::class, 'destroy']);
    });


        Route::prefix('contacts')->group(function () {
        Route::get('/', [ContactController::class, 'index']);
        Route::post('/', [ContactController::class, 'store']);
        Route::get('/{id}', [ContactController::class, 'show']);
        Route::post('/{id}', [ContactController::class, 'update']);
        Route::delete('/{id}', [ContactController::class, 'destroy']);
    });



    Route::prefix('opportunities')->group(function () {
        Route::get('/', [OpportunityController::class, 'index']);
        Route::post('/', [OpportunityController::class, 'store']);
        Route::get('/{id}', [OpportunityController::class, 'show']);
        Route::post('/{id}', [OpportunityController::class, 'update']);
        Route::delete('/{id}', [OpportunityController::class, 'destroy']);
    });


     Route::prefix('opportunity-stages')->group(function () {
        Route::get('/', [OpportunityStageController::class, 'index']);
        Route::post('/', [OpportunityStageController::class, 'store']);
        Route::get('/{id}', [OpportunityStageController::class, 'show']);
        Route::post('/{id}', [OpportunityStageController::class, 'update']);
        Route::delete('/{id}', [OpportunityStageController::class, 'destroy']);
    });



    Route::prefix('activities')->group(function () {
        Route::get('/', [ActivityController::class, 'index']);
        Route::post('/', [ActivityController::class, 'store']);
        Route::get('/{id}', [ActivityController::class, 'show']);
        Route::post('/{id}', [ActivityController::class, 'update']);
        Route::delete('/{id}', [ActivityController::class, 'destroy']);
    });


    Route::prefix('campaigns')->group(function () {
        Route::get('/', [CampaignController::class, 'index']);
        Route::post('/', [CampaignController::class, 'store']);
        Route::get('/{id}', [CampaignController::class, 'show']);
        Route::post('/{id}', [CampaignController::class, 'update']);
        Route::delete('/{id}', [CampaignController::class, 'destroy']);
    });


        Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index']);
        Route::post('/', [TicketController::class, 'store']);
        Route::get('/{id}', [TicketController::class, 'show']);
        Route::post('/{id}', [TicketController::class, 'update']);
        Route::delete('/{id}', [TicketController::class, 'destroy']);
    });

});




Route::prefix('pos')->group(function () {

    Route::prefix('tax-groups')->group(function () {
        Route::get('/', [TaxGroupController::class, 'index']);
        Route::post('/', [TaxGroupController::class, 'store']);
        Route::get('/{id}', [TaxGroupController::class, 'show']);
        Route::post('/{id}', [TaxGroupController::class, 'update']);
        Route::delete('/{id}', [TaxGroupController::class, 'destroy']);
    });

    Route::prefix('tax-rates')->group(function () {
        Route::get('/', [TaxRateController::class, 'index']);
        Route::post('/', [TaxRateController::class, 'store']);
        Route::get('/{id}', [TaxRateController::class, 'show']);
        Route::post('/{id}', [TaxRateController::class, 'update']);
        Route::delete('/{id}', [TaxRateController::class, 'destroy']);
    });


     Route::prefix('receipt-templates')->group(function () {
        Route::get('/', [ReceiptTemplateController::class, 'index']);
        Route::post('/', [ReceiptTemplateController::class, 'store']);
        Route::get('/{id}', [ReceiptTemplateController::class, 'show']);
        Route::post('/{id}', [ReceiptTemplateController::class, 'update']);
        Route::delete('/{id}', [ReceiptTemplateController::class, 'destroy']);
    });


      Route::prefix('payment-gateways')->group(function () {
        Route::get('/', [PaymentGatewayController::class, 'index']);
        Route::post('/', [PaymentGatewayController::class, 'store']);
        Route::get('/{id}', [PaymentGatewayController::class, 'show']);
        Route::post('/{id}', [PaymentGatewayController::class, 'update']);
        Route::delete('/{id}', [PaymentGatewayController::class, 'destroy']);
    });


      Route::prefix('payment-methods')->group(function () {
        Route::get('/', [PaymentMethodController::class, 'index']);
        Route::post('/', [PaymentMethodController::class, 'store']);
        Route::get('/{id}', [PaymentMethodController::class, 'show']);
        Route::post('/{id}', [PaymentMethodController::class, 'update']);
        Route::delete('/{id}', [PaymentMethodController::class, 'destroy']);
    });


     Route::prefix('vouchers')->group(function () {
        Route::get('/', [VoucherController::class, 'index']);
        Route::post('/', [VoucherController::class, 'store']);
        Route::get('/{id}', [VoucherController::class, 'show']);
        Route::post('/{id}', [VoucherController::class, 'update']);
        Route::delete('/{id}', [VoucherController::class, 'destroy']);
    });


     Route::prefix('gift-cards')->group(function () {
        Route::get('/', [GiftCardController::class, 'index']);
        Route::post('/', [GiftCardController::class, 'store']);
        Route::get('/{id}', [GiftCardController::class, 'show']);
        Route::post('/{id}', [GiftCardController::class, 'update']);
        Route::delete('/{id}', [GiftCardController::class, 'destroy']);
    });

    Route::prefix('customer-groups')->group(function () {
        Route::get('/', [CustomerGroupController::class, 'index']);
        Route::post('/', [CustomerGroupController::class, 'store']);
        Route::get('/{id}', [CustomerGroupController::class, 'show']);
        Route::post('/{id}', [CustomerGroupController::class, 'update']);
        Route::delete('/{id}', [CustomerGroupController::class, 'destroy']);
    });

      Route::prefix('customers')->group(function () {
        Route::get('/', [CustomersController::class, 'index']);
        Route::post('/', [CustomersController::class, 'store']);
        Route::get('/{id}', [CustomersController::class, 'show']);
        Route::post('/{id}', [CustomersController::class, 'update']);
        Route::delete('/{id}', [CustomersController::class, 'destroy']);
    });


     Route::prefix('customer-addresses')->group(function () {
        Route::get('/', [CustomerAddressController::class, 'index']);
        Route::post('/', [CustomerAddressController::class, 'store']);
        Route::get('/{id}', [CustomerAddressController::class, 'show']);
        Route::post('/{id}', [CustomerAddressController::class, 'update']);
        Route::delete('/{id}', [CustomerAddressController::class, 'destroy']);
    });


     Route::prefix('terminals')->group(function () {
        Route::get('/', [PosTerminalController::class, 'index']);
        Route::post('/', [PosTerminalController::class, 'store']);
        Route::get('/{id}', [PosTerminalController::class, 'show']);
        Route::post('/{id}', [PosTerminalController::class, 'update']);
        Route::delete('/{id}', [PosTerminalController::class, 'destroy']);
    });


    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::post('/', [SaleController::class, 'store']);
        Route::get('/{id}', [SaleController::class, 'show']);
        Route::post('/{id}', [SaleController::class, 'update']);
        Route::delete('/{id}', [SaleController::class, 'destroy']);
    });


    Route::prefix('sale-discounts')->group(function () {
        Route::get('/', [SaleDiscountController::class, 'index']);
        Route::post('/', [SaleDiscountController::class, 'store']);
        Route::get('/{id}', [SaleDiscountController::class, 'show']);
        Route::post('/{id}', [SaleDiscountController::class, 'update']);
        Route::delete('/{id}', [SaleDiscountController::class, 'destroy']);
    });


     Route::prefix('sale-payments')->group(function () {
        Route::get('/', [SalePaymentController::class, 'index']);
        Route::post('/', [SalePaymentController::class, 'store']);
        Route::get('/{id}', [SalePaymentController::class, 'show']);
        Route::post('/{id}', [SalePaymentController::class, 'update']);
        Route::delete('/{id}', [SalePaymentController::class, 'destroy']);
    });


      Route::prefix('hold-carts')->group(function () {
        Route::get('/', [HoldCartController::class, 'index']);
        Route::post('/', [HoldCartController::class, 'store']);
        Route::get('/{id}', [HoldCartController::class, 'show']);
        Route::post('/{id}', [HoldCartController::class, 'update']);
        Route::delete('/{id}', [HoldCartController::class, 'destroy']);
    });


     Route::prefix('sale-taxes')->group(function () {
        Route::get('/', [SaleTaxController::class, 'index']);
        Route::post('/', [SaleTaxController::class, 'store']);
        Route::get('/{id}', [SaleTaxController::class, 'show']);
        Route::post('/{id}', [SaleTaxController::class, 'update']);
        Route::delete('/{id}', [SaleTaxController::class, 'destroy']);
    });


    Route::prefix('sale-items')->group(function () {
        Route::get('/', [SaleItemController::class, 'index']);
        Route::post('/', [SaleItemController::class, 'store']);
        Route::get('/{id}', [SaleItemController::class, 'show']);
        Route::post('/{id}', [SaleItemController::class, 'update']);
        Route::delete('/{id}', [SaleItemController::class, 'destroy']);
    });


    Route::prefix('sessions')->group(function () {
        Route::get('/', [PosSessionController::class, 'index']);
        Route::post('/', [PosSessionController::class, 'store']);
        Route::get('/{id}', [PosSessionController::class, 'show']);
        Route::post('/{id}', [PosSessionController::class, 'update']);
        Route::delete('/{id}', [PosSessionController::class, 'destroy']);
    });


     Route::prefix('receipts')->group(function () {
        Route::get('/', [ReceiptsController::class, 'index']);
        Route::post('/', [ReceiptsController::class, 'store']);
        Route::get('/{id}', [ReceiptsController::class, 'show']);
        Route::post('/{id}', [ReceiptsController::class, 'update']);
        Route::delete('/{id}', [ReceiptsController::class, 'destroy']);
    });


});
