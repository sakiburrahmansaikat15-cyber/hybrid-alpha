<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Stocks;
use App\Models\HRM\Employee;
use App\Models\POS\Sale;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Export Inventory Report to CSV
     */
    public function inventoryExport()
    {
        $products = Product::with(['category', 'brand'])->get();

        $response = new StreamedResponse(function () use ($products) {
            $handle = fopen('php://output', 'w');

            // Header
            fputcsv($handle, ['ID', 'Name', 'Category', 'Brand', 'Status', 'Description']);

            foreach ($products as $p) {
                fputcsv($handle, [
                    $p->id,
                    $p->name,
                    $p->category->name ?? 'N/A',
                    $p->brand->name ?? 'N/A',
                    $p->status,
                    $p->description
                ]);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="inventory_report_' . date('Ymd') . '.csv"');

        return $response;
    }

    /**
     * Export Employee Report to CSV
     */
    public function employeeExport()
    {
        $employees = Employee::with(['department', 'designation'])->get();

        $response = new StreamedResponse(function () use ($employees) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Code', 'Name', 'Department', 'Designation', 'Join Date', 'Email', 'Status']);

            foreach ($employees as $e) {
                fputcsv($handle, [
                    $e->employee_code,
                    $e->first_name . ' ' . $e->last_name,
                    $e->department->name ?? 'N/A',
                    $e->designation->name ?? 'N/A',
                    $e->join_date,
                    $e->email,
                    $e->status
                ]);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="employee_report_' . date('Ymd') . '.csv"');

        return $response;
    }

    /**
     * Export Sales Report to CSV
     */
    public function salesExport()
    {
        $sales = Sale::latest()->get();

        $response = new StreamedResponse(function () use ($sales) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Invoice No', 'Total Amount', 'Status', 'Created At']);

            foreach ($sales as $s) {
                fputcsv($handle, [
                    $s->invoice_no,
                    $s->total_amount,
                    $s->status,
                    $s->created_at
                ]);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="sales_report_' . date('Ymd') . '.csv"');

        return $response;
    }
}
