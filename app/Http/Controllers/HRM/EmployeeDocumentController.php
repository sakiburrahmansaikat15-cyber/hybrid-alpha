<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeDocumentResource;
use App\Models\HRM\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class EmployeeDocumentController extends Controller
{
  
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = EmployeeDocument::query();


        if ($keyword) {
            $query->where('document_type', 'like', "%{$keyword}%");
        }


        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Employee Documents fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => EmployeeDocumentResource::collection($data),
                ],
            ]);
        }


        $limit = (int) $limit ?: 10;
        $documents = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Employee Documents fetched successfully',
            'pagination' => [
                'current_page' => $documents->currentPage(),
                'per_page' => $documents->perPage(),
                'total_items' => $documents->total(),
                'total_pages' => $documents->lastPage(),
                'data' => EmployeeDocumentResource::collection($documents),
            ],
        ]);
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'document_type' => 'required|string|max:255',
            'document_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();


        if ($request->hasFile('document_file')) {
            $folder = public_path('employee_documents');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $file = $request->file('document_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->move($folder, $fileName);
            $data['document_file'] = 'employee_documents/' . $fileName;
        }

        $document = EmployeeDocument::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee Document created successfully',
            'data' => new EmployeeDocumentResource($document)
        ], 201);
    }


    public function show($id)
    {
        $document = EmployeeDocument::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Employee Document not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new EmployeeDocumentResource($document)
        ], 200);
    }


    public function update(Request $request, $id)
    {
        $document = EmployeeDocument::findOrFail($id);

        $data = $request->validate([
            'employee_id' => 'sometimes|exists:employees,id',
            'document_type' => 'sometimes|string|max:255',
            'document_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);


        if ($request->hasFile('document_file')) {
            if ($document->document_file && File::exists(public_path($document->document_file))) {
                File::delete(public_path($document->document_file));
            }

            $folder = public_path('employee_documents');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $file = $request->file('document_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->move($folder, $fileName);
            $data['document_file'] = 'employee_documents/' . $fileName;
        }

        $document->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee Document updated successfully',
            'data' => new EmployeeDocumentResource($document)
        ], 200);
    }


    public function destroy($id)
    {
        $document = EmployeeDocument::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Employee Document not found'
            ], 404);
        }

        if ($document->document_file && File::exists(public_path($document->document_file))) {
            File::delete(public_path($document->document_file));
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee Document deleted successfully'
        ], 200);
    }
}
