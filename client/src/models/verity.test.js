import {init}		from '@rematch/core';
import verity		from './verity';
import Filter		from './Filter';
import * as loglevel		from 'loglevel';

const log		= loglevel.getLogger('../models/verity.test');


describe('verity', () => {
	//{{{
	let store
	let api

	beforeEach(() => {
		//mock the api
		api		= require('../api/treeTrackerApi').default
		api.getTreeImages		= jest.fn(() => Promise.resolve([{
				id		: '1',
			}]));
		api.approveTreeImage		= () => Promise.resolve(true);
		api.rejectTreeImage		= () => Promise.resolve(true);
		api.undoTreeImage		= () => Promise.resolve(true);
    api.getUnverifiedTreeCount = () => Promise.resolve({
      count   : 1
    });
	})

	describe('with a default store', () => {
		//{{{
		beforeEach(() => {
			store		= init({
				models		: {
					verity,
				},
			})
		})

		it('check initial state', () => {
			expect(store.getState().verity.isLoading).toBe(false)
		})

		describe('loadMoreTreeImages() ', () => {
			//{{{
			beforeEach(async () => {
				const result		= await store.dispatch.verity.loadMoreTreeImages()
				expect(result).toBe(true)
			})

			it('should get some trees', () => {
				expect(store.getState().verity.treeImages).toHaveLength(1)
			})

			it('should call api with param: skip = 0', () => {
				expect(api.getTreeImages.mock.calls[0][0]).toMatchObject({
					skip		: 0,
				})
			})

			it('by default, should call tree api with filter: approve=false, active=true', () => {
				expect(api.getTreeImages.mock.calls[0][0]).toMatchObject({
					filter		: {
						approved		: false,
						active		: true,
					},
				})
			})

      describe('getTreeCount()', () => {
        beforeEach(async () => {
          const result    = await store.dispatch.verity.getTreeCount()
          expect(result).toBe(true)
        })

        it('getTreeCount should be 1', () => {
          expect(store.getState().verity.treeCount).toBe(1)
        })
      })

			describe('approveTreeImage(1)', () => {
				//{{{
				beforeEach(async () => {
					const result		= await store.dispatch.verity.approveTreeImage('1');
					expect(result).toBe(true)
				})

				it('state tree list should removed the tree, so, get []', () => {
					expect(store.getState().verity.treeImages).toHaveLength(0)
				})

				//}}}
			})

			describe('rejectTreeImage(1)', () => {
				//{{{
				beforeEach(async () => {
					const result		= await store.dispatch.verity.rejectTreeImage('1');
					expect(result).toBe(true)
				})

				it('state tree list should removed the tree, so, get []', () => {
					expect(store.getState().verity.treeImages).toHaveLength(0)
				})

				//}}}
			})


			describe('loadMoreTreeImages() load second page', () => {
				//{{{
				beforeEach(async () => {
					api.getTreeImages.mockClear()
					await store.dispatch.verity.loadMoreTreeImages();
				})

				it('should call api with param: skip = 1', () => {
					expect(api.getTreeImages.mock.calls[0][0]).toMatchObject({
						skip		: 1,
					})
				})
				//}}}
			})

			describe('updateFilter({approved:false, active:false}) test filter', () =>{
				//{{{
				beforeEach(async () => {
					//clear
					api.getTreeImages.mockClear();
					const filter		= new Filter();
					filter.approved		= false;
					filter.active		= false;
					await store.dispatch.verity.updateFilter(filter);
				})

				it('after updateFilter, should call load trees with filter(approved:false, active:false)', () => {
					expect(api.getTreeImages.mock.calls[0][0]).toMatchObject({
						filter		: {
							approved		: false,
							active		: false,
						},
					})
				})
				//}}}
			})

			//}}}
		})

		//}}}
	})

	describe('a store with 10 trees', () => {
		//{{{
		beforeEach(() => {
			//9, 8, 7, 6, 5, 4, 3, 2, 1, 0
			const verityInit		= {
				state		: {
					...verity.state,
					treeImages		: Array.from(new Array(10)).map((e, i) => {
						return {
							id		: (9 - i),
							imageUrl		: 'http://' + (9 - i),
						}
					}),
				},
				reducers		: verity.reducers,
				effects		: verity.effects,
			}
			store		= init({
				models		: {
					verity		: verityInit,
				},
			})
		})

		it('the tree images has length 10', () => {
			log.debug(store.getState().verity.treeImages);
			expect(store.getState().verity.treeImages).toHaveLength(10);
		})

		describe('selectAll(true)', () => {
			//{{{
			beforeEach(() => {
				store.dispatch.verity.selectAll(true)
			})

			it('selected should be 10', () => {
				expect(store.getState().verity.treeImagesSelected).toHaveLength(10)
			})

			describe('selectAll(false)', () => {
				//{{{
				beforeEach(() => {
					store.dispatch.verity.selectAll(false)
				})

				it('selected should be 0', () => {
					expect(store.getState().verity.treeImagesSelected).toHaveLength(0)
				})

				//}}}
			})
			//}}}
		})

		describe('clickTree(7)', () => {
			//{{{
			beforeEach(() => {
				//9, 8, 7, 6, 5, 4, 3, 2, 1, 0
				store.dispatch.verity.clickTree({treeId:7})
			})

			it('treeImagesSelected should be [7]', () => {
				expect(store.getState().verity.treeImagesSelected).toMatchObject(
					[7]
				)
			})

			it('treeImageAnchor should be 7', () => {
				expect(store.getState().verity.treeImageAnchor).toBe(7)
			})

			describe('clickTree(5)', () => {
				//{{{
				beforeEach(() => {
					//9, 8, 7, 6, 5, 4, 3, 2, 1, 0
					store.dispatch.verity.clickTree({treeId:5})
				})

				it('treeImagesSelected should be [5]', () => {
					expect(store.getState().verity.treeImagesSelected).toMatchObject(
						[5]
					)
				})
				//}}}
			})

			describe('clickTree(5, isShift)', () => {
				//{{{
				beforeEach(() => {
					//9, 8, 7, 6, 5, 4, 3, 2, 1, 0
					store.dispatch.verity.clickTree({treeId:5, isShift:true})
				})

				it('treeImagesSelected should be [7, 6, 5]', () => {
					//9, 8, [7, 6, 5], 4, 3, 2, 1, 0
					expect(store.getState().verity.treeImagesSelected).toMatchObject(
						[7, 6, 5]
					)
				})

				describe('approveAll()', () => {
					//{{{
					beforeEach(async () => {
						await store.dispatch.verity.approveAll();
					})

					it('isBulkApproving === true', () => {
						expect(store.getState().verity.isBulkApproving).toBe(true)
					})

					it('tree images should be 7', () => {
						expect(store.getState().verity.treeImages).toHaveLength(7)
					})

					it('isApproveAllProcessing === false', () => {
						expect(store.getState().verity.isApproveAllProcessing).toBe(false)
					})

					it('after approveAll, some page information should be reset, pagesLoaded = -1', () => {
						expect(store.getState().verity.pagesLoaded).toBe(-1)
					})

					it('after approveAll, should get an undo list', () => {
						expect(store.getState().verity.treeImagesUndo).toHaveLength(3)
					})

					describe('undoAll()', () => {
						//{{{
						beforeEach(async () => {
							await store.dispatch.verity.undoAll()
						})

						it('tree list should restore to 10', () => {
							expect(store.getState().verity.treeImages).toHaveLength(10)
						})

						it('isBulkApproving === false', () => {
							expect(store.getState().verity.isBulkApproving).toBe(false)
						})

						it('tree list order should be correct', () => {
							expect(store.getState().verity.treeImages.map(tree => tree.id)).toMatchObject(
								[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
							)
						})
						//}}}
					})

					//}}}
				})

				describe('rejectAll()', () => {
					//{{{
					beforeEach(async () => {
						await store.dispatch.verity.rejectAll();
					})

					it('isBulkRejecting === true', () => {
						expect(store.getState().verity.isBulkRejecting).toBe(true)
					})

					it('tree images should be 7', () => {
						expect(store.getState().verity.treeImages).toHaveLength(7)
					})

					it('isRejectAllProcessing === false', () => {
						expect(store.getState().verity.isRejectAllProcessing).toBe(false)
					})

					it('after rejectAll, some page information should be reset, pagesLoaded = -1', () => {
						expect(store.getState().verity.pagesLoaded).toBe(-1)
					})

					it('after rejectAll, should get an undo list', () => {
						expect(store.getState().verity.treeImagesUndo).toHaveLength(3)
					})

					describe('undoAll()', () => {
						//{{{
						beforeEach(async () => {
							await store.dispatch.verity.undoAll()
						})

						it('isBulkRejecting === false', () => {
							expect(store.getState().verity.isBulkRejecting).toBe(false)
						})

						it('tree list should restore to 10', () => {
							expect(store.getState().verity.treeImages).toHaveLength(10)
						})

						it('tree list order should be correct', () => {
							expect(store.getState().verity.treeImages.map(tree => tree.id)).toMatchObject(
								[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
							)
						})
						//}}}
					})

					//}}}
				})

				describe('clickTree(9, isShift)', () => {
					//{{{
					beforeEach(() => {
						store.dispatch.verity.clickTree({treeId:9, isShift:true})
					})

					it('treeImagesSelected should be [9,8,7]', () => {
						expect(store.getState().verity.treeImagesSelected).toMatchObject(
							[9, 8, 7]
						)
					})
					//}}}
				})

				describe('clickTree(0)', () => {
					//{{{
					beforeEach(() => {
						store.dispatch.verity.clickTree({treeId:0})
					})

					it('treeImagesSelected should be [0]', () => {
						expect(store.getState().verity.treeImagesSelected).toMatchObject(
							[0]
						)
					})
					//}}}
				})

				//}}}
			})

			//}}}
		})


		//}}}
	})



	//}}}
})

