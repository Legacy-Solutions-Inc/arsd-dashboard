// 'use client';

// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Loader2, TestTube } from 'lucide-react';

// export function ParseTestComponent() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   const testParsing = async () => {
//     setLoading(true);
//     setError(null);
//     setSuccess(null);

//     try {
//       console.log('🧪 Starting manual parsing test...');
      
//       const response = await fetch('/api/accomplishment-reports/parse-approved', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({}) // Explicitly send empty body
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || 'Failed to trigger parsing');
//       }

//       setSuccess(`Test completed: ${result.message}`);
//       console.log('🧪 Test result:', result);
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error';
//       setError(errorMessage);
//       console.error('🧪 Test error:', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="mb-6">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <TestTube className="h-5 w-5 text-orange-600" />
//           Parse Test Component
//         </CardTitle>
//         <CardDescription>
//           Manual test component to trigger parsing and see debug logs
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <Button
//           onClick={testParsing}
//           disabled={loading}
//           className="bg-orange-600 hover:bg-orange-700"
//         >
//           {loading ? (
//             <>
//               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//               Testing...
//             </>
//           ) : (
//             <>
//               <TestTube className="h-4 w-4 mr-2" />
//               Test Parsing
//             </>
//           )}
//         </Button>

//         {error && (
//           <Alert variant="destructive">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {success && (
//           <Alert className="border-green-200 bg-green-50">
//             <AlertDescription className="text-green-800">{success}</AlertDescription>
//           </Alert>
//         )}

//         <div className="text-sm text-gray-600">
//           <p>This will trigger parsing of all approved reports and show detailed debug logs in the console.</p>
//           <p>Check the browser console for detailed debugging information.</p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
