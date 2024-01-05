const { handleExpirations } = require('../../services/userService');
const { User } = require('../../models/user');



describe('handleExpirations', () => {
    beforeAll(() => {
      jest.spyOn(User, 'find').mockImplementation(() => ({
        exec: jest.fn() // mock exec if your User.find chain calls exec()
      }));
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });

    
  it('should set expired users to non-premium and reset generations', async () => {
    // Mock users that would be found in the database
    const mockUsers = [
      { premium: true, generations: 10, subscriptionExpiration: new Date('2020-01-01'), save: jest.fn() },
      { premium: true, generations: 15, subscriptionExpiration: new Date('2020-01-02'), save: jest.fn() }
    ];

    User.find.mockResolvedValue(mockUsers);

    const affectedRows = await handleExpirations();

    // Check if the right number of users were affected
    expect(affectedRows).toBe(mockUsers.length);

    // Check if each user's properties were updated and save was called
    for (const user of mockUsers) {
      expect(user.premium).toBe(false);
      expect(user.generations).toBe(5);
      expect(user.save).toHaveBeenCalled();
    }
  });

  it('should handle case with no expired users', async () => {
    User.find.mockResolvedValue([]);

    const affectedRows = await handleExpirations();

    // Expect no users to be affected
    expect(affectedRows).toBe(0);
  });

  // You can add more tests for different scenarios, such as error handling
});
