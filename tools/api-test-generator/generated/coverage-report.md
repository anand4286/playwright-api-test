# API Test Coverage Report

## Summary
- **Total Endpoints**: 20
- **Total Tests Generated**: 40
- **Coverage**: 100.0%

## Endpoints Coverage

| Method | Path | Operation ID | Status |
|--------|------|--------------|--------|
| POST | /pet/{petId}/uploadImage | uploadFile | ✅ Covered |\n| POST | /pet | addPet | ✅ Covered |\n| PUT | /pet | updatePet | ✅ Covered |\n| GET | /pet/findByStatus | findPetsByStatus | ✅ Covered |\n| GET | /pet/findByTags | findPetsByTags | ✅ Covered |\n| GET | /pet/{petId} | getPetById | ✅ Covered |\n| POST | /pet/{petId} | updatePetWithForm | ✅ Covered |\n| DELETE | /pet/{petId} | deletePet | ✅ Covered |\n| GET | /store/inventory | getInventory | ✅ Covered |\n| POST | /store/order | placeOrder | ✅ Covered |\n| GET | /store/order/{orderId} | getOrderById | ✅ Covered |\n| DELETE | /store/order/{orderId} | deleteOrder | ✅ Covered |\n| POST | /user/createWithList | createUsersWithListInput | ✅ Covered |\n| GET | /user/{username} | getUserByName | ✅ Covered |\n| PUT | /user/{username} | updateUser | ✅ Covered |\n| DELETE | /user/{username} | deleteUser | ✅ Covered |\n| GET | /user/login | loginUser | ✅ Covered |\n| GET | /user/logout | logoutUser | ✅ Covered |\n| POST | /user/createWithArray | createUsersWithArrayInput | ✅ Covered |\n| POST | /user | createUser | ✅ Covered |

## Test Files Generated
- pet.spec.ts\n- store.spec.ts\n- user.spec.ts

Generated on: 2025-08-17T11:28:22.051Z
