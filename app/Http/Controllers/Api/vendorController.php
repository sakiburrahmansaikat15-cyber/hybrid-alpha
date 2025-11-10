<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\vendor;
use Illuminate\Http\Request;

class vendorController extends Controller
{
    /**
     * Display a listing of the resource with pagination.
     */
    public function index(Request $request)
    {
        // Pagination: if limit provided return paginated result else return all
        if($request->limit){
            $vendors = vendor::paginate($request->limit);
        }else{
            $vendors = vendor::all();
        }

        return response()->json([
            'status' => true,
            'data' => $vendors
        ]);
    }

    /**
     * Search vendor by name, shop_name, email, contact.
     */
    public function search(Request $request)
    {
        $query = $request->search;

        $vendors = vendor::where('name', 'like', "%$query%")
            ->orWhere('shop_name', 'like', "%$query%")
            ->get();

        return response()->json([
            'status' => true,
            'data' => $vendors
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'=>'required',
            'shop_name'=>'required',
            'email'=>'required|email|unique:vendors,email',
            'status'=>'required'
        ]);

        $imageName = null;

        if($request->hasFile('image')){
            $image = $request->file('image');
            $imageName = time().'.'.$image->getClientOriginalExtension();
            $image->move(public_path('vendore'), $imageName);
        }

        vendor::create([
            'name'=>$request->name,
            'shop_name'=>$request->shop_name,
            'email'=>$request->email,
            'user_id'=>$request->user_id,
            'contact'=>$request->contact,
            'address'=>$request->address,
            'image'=>$imageName,
            'status'=>$request->status
        ]);

        return response()->json([
            'status'=>true,
            'message'=>'Vendor Created Successfully'
        ]);
    }

    public function show($id)
    {
        $vendor = vendor::find($id);

        if(!$vendor){
            return response()->json([
                'status'=>false,
                'message'=>'Vendor Not Found'
            ],404);
        }

        return response()->json([
            'status'=>true,
            'data'=>$vendor
        ]);
    }

    public function update(Request $request, $id)
    {
        $vendor = vendor::find($id);

        if(!$vendor){
            return response()->json(['no data found']);
        }

        if($request->hasFile('image')){
            if($vendor->image && file_exists(public_path('vendore/'.$vendor->image))){
                unlink(public_path('vendore/'.$vendor->image));
            }

            $image = $request->file('image');
            $imageName = time().'.'.$image->getClientOriginalExtension();
            $image->move(public_path('vendore'), $imageName);

            $vendor->image = $imageName;
        }

        $vendor->update([
            'name'=>$request->name,
            'shop_name'=>$request->shop_name,
            'email'=>$request->email,
            'user_id'=>$request->user_id,
            'contact'=>$request->contact,
            'address'=>$request->address,
            'status'=>$request->status
        ]);

        return response()->json(['Vendor Updated Successfully']);
    }

    public function destroy($id)
    {
        $vendor = vendor::findorFail($id);

        if($vendor->image && file_exists(public_path('vendore/'.$vendor->image))){
            unlink(public_path('vendore/'.$vendor->image));
        }

        $vendor->delete();
        return response()->json(['Vendor Deleted Successfully']);
    }
}
