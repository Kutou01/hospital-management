'use client';

export default function TestPage() {
    console.log('🧪 [Test Page] Component rendered successfully!');
    
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-green-600 mb-4">
                ✅ Test Page Works!
            </h1>
            <p className="text-gray-600">
                If you see this, routing is working correctly.
            </p>
            <p className="text-sm text-gray-500 mt-4">
                Check console for: 🧪 [Test Page] Component rendered successfully!
            </p>
        </div>
    );
}
